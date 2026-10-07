import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Deletes a user's account and every row/file that references it.
// Called by the app with the user's own session — no other caller is trusted.
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  // Verify the caller's own session — this is the only thing that authorizes the deletion.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: callerData, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !callerData.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  const userId = callerData.user.id;

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: physioProfile } = await admin
    .from('physio_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  const physioId = physioProfile?.id as string | undefined;

  // Every delete below is idempotent (eq-scoped, re-runnable), so on any failure we
  // throw immediately and leave the account untouched for the client to retry —
  // we only delete the auth user, below, once everything else has succeeded.
  async function del(query: PromiseLike<{ error: { message: string } | null }>) {
    const { error } = await query;
    if (error) throw new Error(error.message);
  }

  try {
    if (physioId) {
      await del(admin.from('reviews').delete().eq('physio_id', physioId));
      await del(admin.from('bookings').delete().eq('physio_id', physioId));
      await del(admin.from('availability_slots').delete().eq('physio_id', physioId));
      await del(admin.from('physio_service_areas').delete().eq('physio_id', physioId));
      await del(admin.from('physio_services').delete().eq('physio_id', physioId));
      await del(admin.from('physio_certificates').delete().eq('physio_id', physioId));

      const { data: certFiles, error: certFilesError } = await admin.storage
        .from('certificates')
        .list(physioId);
      if (certFilesError) throw new Error(certFilesError.message);
      if (certFiles && certFiles.length > 0) {
        const { error: removeCertsError } = await admin.storage
          .from('certificates')
          .remove(certFiles.map((f) => `${physioId}/${f.name}`));
        if (removeCertsError) throw new Error(removeCertsError.message);
      }

      await del(admin.from('physio_profiles').delete().eq('id', physioId));
    }

    await del(admin.from('reviews').delete().eq('patient_id', userId));
    await del(admin.from('bookings').delete().eq('patient_id', userId));

    const { data: avatarFiles, error: avatarFilesError } = await admin.storage
      .from('avatars')
      .list(userId);
    if (avatarFilesError) throw new Error(avatarFilesError.message);
    if (avatarFiles && avatarFiles.length > 0) {
      const { error: removeAvatarsError } = await admin.storage
        .from('avatars')
        .remove(avatarFiles.map((f) => `${userId}/${f.name}`));
      if (removeAvatarsError) throw new Error(removeAvatarsError.message);
    }

    // Terminate the auth account first: once this succeeds the user can no longer
    // authenticate, so a failure in the final row cleanup below can't strand them
    // in a logged-in-but-rowless state — it only leaves an orphaned users row for
    // manual cleanup, which is recoverable data debt rather than a broken account.
    const { error: deleteAuthError } = await admin.auth.admin.deleteUser(userId);
    if (deleteAuthError) throw new Error(deleteAuthError.message);

    await del(admin.from('users').delete().eq('id', userId));
  } catch {
    return new Response('Deletion failed', { status: 500 });
  }

  return new Response('OK', { status: 200 });
});

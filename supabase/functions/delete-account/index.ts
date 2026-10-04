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

  try {
    if (physioId) {
      await admin.from('reviews').delete().eq('physio_id', physioId);
      await admin.from('bookings').delete().eq('physio_id', physioId);
      await admin.from('availability_slots').delete().eq('physio_id', physioId);
      await admin.from('physio_service_areas').delete().eq('physio_id', physioId);
      await admin.from('physio_services').delete().eq('physio_id', physioId);
      await admin.from('physio_certificates').delete().eq('physio_id', physioId);

      const { data: certFiles } = await admin.storage.from('certificates').list(physioId);
      if (certFiles && certFiles.length > 0) {
        await admin.storage
          .from('certificates')
          .remove(certFiles.map((f) => `${physioId}/${f.name}`));
      }

      await admin.from('physio_profiles').delete().eq('id', physioId);
    }

    await admin.from('reviews').delete().eq('patient_id', userId);
    await admin.from('bookings').delete().eq('patient_id', userId);

    const { data: avatarFiles } = await admin.storage.from('avatars').list(userId);
    if (avatarFiles && avatarFiles.length > 0) {
      await admin.storage.from('avatars').remove(avatarFiles.map((f) => `${userId}/${f.name}`));
    }

    await admin.from('users').delete().eq('id', userId);

    const { error: deleteAuthError } = await admin.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      return new Response('Deletion failed', { status: 500 });
    }
  } catch {
    return new Response('Deletion failed', { status: 500 });
  }

  return new Response('OK', { status: 200 });
});

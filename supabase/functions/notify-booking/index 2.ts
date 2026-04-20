import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/push/send';
const RESEND_API_URL = 'https://api.resend.com/emails';

type BookingEvent =
  | 'new_booking'
  | 'pending'
  | 'confirmed'
  | 'declined'
  | 'completed'
  | 'cancelled';

type NotificationTarget = {
  full_name: string;
  email: string;
  push_token: string | null;
};

type BookingRow = {
  id: string;
  requested_time: string | null;
  patient: NotificationTarget | null;
  physio_profile: { user: NotificationTarget | null } | null;
  service: { name: string } | null;
};

// ─── Georgian notification strings ───────────────────────────────────────────

const PUSH = {
  new_booking: {
    title: 'ახალი ჯავშანი',
    body: (patientName: string) => `${patientName} ითხოვს ვიზიტს`,
  },
  confirmed: {
    title: 'ჯავშანი დადასტურდა ✓',
    body: (physioName: string) => `${physioName} დაადასტურა თქვენი ჯავშანი`,
  },
  declined: {
    title: 'ჯავშანი უარყოფილია',
    body: (physioName: string) => `${physioName} ვერ შეძლებს ვიზიტს`,
  },
  completed: {
    title: 'ვიზიტი დასრულდა',
    body: () => 'გმადლობთ! გთხოვთ, დატოვოთ შეფასება.',
  },
  cancelled: {
    title: 'ჯავშანი გაუქმდა',
    body: (patientName: string) => `${patientName}-მა გააუქმა ჯავშანი`,
  },
} as const;

const EMAIL_SUBJECT = {
  new_booking: 'ახალი ჯავშნის მოთხოვნა',
  confirmed: 'თქვენი ჯავშანი დადასტურდა',
  declined: 'ჯავშანი უარყოფილია',
} as const;

function emailHtml(event: 'new_booking' | 'confirmed' | 'declined', ctx: {
  recipientName: string;
  otherPartyName: string;
  time: string | null;
  service: string | null;
}): string {
  const greeting = `<p>გამარჯობა, <strong>${ctx.recipientName}</strong>,</p>`;
  const timeRow = ctx.time ? `<p>სასურველი დრო: <strong>${ctx.time}</strong></p>` : '';
  const serviceRow = ctx.service ? `<p>სერვისი: <strong>${ctx.service}</strong></p>` : '';

  if (event === 'new_booking') {
    return `${greeting}
      <p><strong>${ctx.otherPartyName}</strong>-მა მოითხოვა ვიზიტი.</p>
      ${serviceRow}${timeRow}
      <p>გთხოვთ, დაადასტუროთ ან უარყოთ ჯავშანი აპლიკაციაში.</p>`;
  }
  if (event === 'confirmed') {
    return `${greeting}
      <p>ფიზიოთერაპევტი <strong>${ctx.otherPartyName}</strong> დაადასტურა თქვენი ჯავშანი.</p>
      ${timeRow}
      <p>გთხოვთ, იყოთ მზად ვიზიტისთვის.</p>`;
  }
  return `${greeting}
    <p>სამწუხაროდ, <strong>${ctx.otherPartyName}</strong>-მა ვერ შეძლო თქვენი ჯავშნის დადასტურება.</p>
    <p>გთხოვთ, სცადოთ სხვა ფიზიოთერაპევტი.</p>`;
}

// ─── Send helpers ─────────────────────────────────────────────────────────────

async function sendPush(token: string, title: string, body: string): Promise<void> {
  await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: token, title, body, sound: 'default' }),
  });
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  resendKey: string,
  from: string,
): Promise<void> {
  await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendKey}`,
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
}

// ─── Handler ─────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let bookingId: string;
  let event: BookingEvent;

  try {
    const body = await req.json();
    bookingId = body.bookingId;
    event = body.event;
    if (!bookingId || !event) throw new Error('missing fields');
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  if (event === 'pending') {
    return new Response('OK', { status: 200 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const resendKey = Deno.env.get('RESEND_API_KEY') ?? '';
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'notifications@physio.ge';

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      requested_time,
      patient:users!bookings_patient_id_fkey(full_name, email, push_token),
      physio_profile:physio_profiles!bookings_physio_id_fkey(
        user:users!physio_profiles_user_id_fkey(full_name, email, push_token)
      ),
      service:physio_services(name)
    `)
    .eq('id', bookingId)
    .single();

  if (error || !data) {
    return new Response('Booking not found', { status: 400 });
  }

  const booking = data as unknown as BookingRow;
  const patient = booking.patient;
  const physioUser = booking.physio_profile?.user ?? null;
  const service = booking.service?.name ?? null;
  const time = booking.requested_time;

  try {
    if (event === 'new_booking' && physioUser) {
      const patientName = patient?.full_name ?? 'პაციენტი';
      if (physioUser.push_token) {
        await sendPush(
          physioUser.push_token,
          PUSH.new_booking.title,
          PUSH.new_booking.body(patientName),
        );
      }
      if (physioUser.email && resendKey) {
        await sendEmail(
          physioUser.email,
          EMAIL_SUBJECT.new_booking,
          emailHtml('new_booking', {
            recipientName: physioUser.full_name,
            otherPartyName: patientName,
            time,
            service,
          }),
          resendKey,
          fromEmail,
        );
      }
    } else if (event === 'confirmed' && patient) {
      const physioName = physioUser?.full_name ?? 'ფიზიოთერაპევტი';
      if (patient.push_token) {
        await sendPush(
          patient.push_token,
          PUSH.confirmed.title,
          PUSH.confirmed.body(physioName),
        );
      }
      if (patient.email && resendKey) {
        await sendEmail(
          patient.email,
          EMAIL_SUBJECT.confirmed,
          emailHtml('confirmed', {
            recipientName: patient.full_name,
            otherPartyName: physioName,
            time,
            service,
          }),
          resendKey,
          fromEmail,
        );
      }
    } else if (event === 'declined' && patient) {
      const physioName = physioUser?.full_name ?? 'ფიზიოთერაპევტი';
      if (patient.push_token) {
        await sendPush(
          patient.push_token,
          PUSH.declined.title,
          PUSH.declined.body(physioName),
        );
      }
      if (patient.email && resendKey) {
        await sendEmail(
          patient.email,
          EMAIL_SUBJECT.declined,
          emailHtml('declined', {
            recipientName: patient.full_name,
            otherPartyName: physioName,
            time,
            service,
          }),
          resendKey,
          fromEmail,
        );
      }
    } else if (event === 'completed' && patient?.push_token) {
      await sendPush(patient.push_token, PUSH.completed.title, PUSH.completed.body());
    } else if (event === 'cancelled' && physioUser?.push_token) {
      const patientName = patient?.full_name ?? 'პაციენტი';
      await sendPush(
        physioUser.push_token,
        PUSH.cancelled.title,
        PUSH.cancelled.body(patientName),
      );
    }
  } catch (err) {
    console.error('[notify-booking] send error:', err);
    // Non-fatal — notification failure must never break booking flow
  }

  return new Response('OK', { status: 200 });
});

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import BookingCard from 'src/components/BookingCard';
import { BookingWithJoins } from 'src/types';

const base: BookingWithJoins = {
  id: 'b-1',
  patient_id: 'patient-1',
  physio_id: 'physio-profile-1',
  slot_id: null,
  service_id: 'svc-1',
  status: 'pending',
  patient_address: 'რუსთაველის გამზ. 42',
  patient_district_id: 'district-1',
  notes: null,
  requested_time: 'ოთხშაბათი 14:00',
  created_at: '2024-01-15T10:00:00Z',
  physio_profile: {
    id: 'physio-profile-1',
    available_hours: null,
    user: { full_name: 'Nino Beridze', avatar_url: null },
    base_district: { name_ka: 'ვაკე' },
  },
  patient: { full_name: 'Giorgi Gelashvili', phone: '+995555123456' },
  service: { name: 'ზურგის მასაჟი', duration_minutes: 60, price: 50 },
};

describe('BookingCard — patient role', () => {
  it('shows physio full name', () => {
    const { getByText } = render(<BookingCard booking={base} role="patient" />);
    expect(getByText('Nino Beridze')).toBeTruthy();
  });

  it('shows physio district as subtitle', () => {
    const { getByText } = render(<BookingCard booking={base} role="patient" />);
    expect(getByText('ვაკე')).toBeTruthy();
  });

  it('shows service name, duration and price', () => {
    const { getByText } = render(<BookingCard booking={base} role="patient" />);
    expect(getByText(/ზურგის მასაჟი/)).toBeTruthy();
    expect(getByText(/60/)).toBeTruthy();
    expect(getByText(/50/)).toBeTruthy();
  });

  it('hides service row when service is null', () => {
    const { queryByText } = render(
      <BookingCard booking={{ ...base, service: null }} role="patient" />,
    );
    expect(queryByText(/ზურგის მასაჟი/)).toBeNull();
  });

  it('shows requested time', () => {
    const { getByText } = render(<BookingCard booking={base} role="patient" />);
    expect(getByText('ოთხშაბათი 14:00')).toBeTruthy();
  });

  it('hides time row when requested_time is null', () => {
    const { queryByText } = render(
      <BookingCard booking={{ ...base, requested_time: null }} role="patient" />,
    );
    expect(queryByText('ოთხშაბათი 14:00')).toBeNull();
  });

  it('shows patient address', () => {
    const { getByText } = render(<BookingCard booking={base} role="patient" />);
    expect(getByText('რუსთაველის გამზ. 42')).toBeTruthy();
  });

  it('hides address row when patient_address is null', () => {
    const { queryByText } = render(
      <BookingCard booking={{ ...base, patient_address: null }} role="patient" />,
    );
    expect(queryByText('რუსთაველის გამზ. 42')).toBeNull();
  });

  it('shows formatted date (DD.MM.YYYY)', () => {
    const { getByText } = render(<BookingCard booking={base} role="patient" />);
    expect(getByText('15.01.2024')).toBeTruthy();
  });

  it('does not show confirm or decline buttons', () => {
    const { queryByText } = render(
      <BookingCard booking={base} role="patient" onConfirm={jest.fn()} onDecline={jest.fn()} />,
    );
    expect(queryByText('დადასტურება')).toBeNull();
    expect(queryByText('უარყოფა')).toBeNull();
  });

  it('shows initials avatar when no avatar_url', () => {
    const { getByText } = render(<BookingCard booking={base} role="patient" />);
    expect(getByText('NB')).toBeTruthy();
  });
});

describe('BookingCard — physio role', () => {
  it('shows patient full name', () => {
    const { getByText } = render(<BookingCard booking={base} role="physio" />);
    expect(getByText('Giorgi Gelashvili')).toBeTruthy();
  });

  it('shows patient phone as subtitle', () => {
    const { getByText } = render(<BookingCard booking={base} role="physio" />);
    expect(getByText('+995555123456')).toBeTruthy();
  });

  it('shows confirm and decline buttons for pending booking', () => {
    const { getByText } = render(
      <BookingCard booking={base} role="physio" onConfirm={jest.fn()} onDecline={jest.fn()} />,
    );
    expect(getByText('დადასტურება')).toBeTruthy();
    expect(getByText('უარყოფა')).toBeTruthy();
  });

  it('calls onConfirm when confirm pressed', () => {
    const onConfirm = jest.fn();
    const { getByText } = render(
      <BookingCard booking={base} role="physio" onConfirm={onConfirm} onDecline={jest.fn()} />,
    );
    fireEvent.press(getByText('დადასტურება'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onDecline when decline pressed', () => {
    const onDecline = jest.fn();
    const { getByText } = render(
      <BookingCard booking={base} role="physio" onConfirm={jest.fn()} onDecline={onDecline} />,
    );
    fireEvent.press(getByText('უარყოფა'));
    expect(onDecline).toHaveBeenCalledTimes(1);
  });

  it('hides action buttons for non-pending status', () => {
    const confirmed = { ...base, status: 'confirmed' as const };
    const { queryByText } = render(
      <BookingCard booking={confirmed} role="physio" onConfirm={jest.fn()} onDecline={jest.fn()} />,
    );
    expect(queryByText('დადასტურება')).toBeNull();
  });

  it('hides action buttons when no callbacks provided', () => {
    const { queryByText } = render(<BookingCard booking={base} role="physio" />);
    expect(queryByText('დადასტურება')).toBeNull();
  });
});

describe('BookingCard — status badges', () => {
  it.each([
    ['pending', 'მოლოდინში'],
    ['confirmed', 'დადასტურებული'],
    ['declined', 'უარყოფილი'],
    ['completed', 'დასრულებული'],
    ['cancelled', 'გაუქმებული'],
  ] as const)('shows correct badge for %s', (status, label) => {
    const { getByText } = render(
      <BookingCard booking={{ ...base, status }} role="patient" />,
    );
    expect(getByText(label)).toBeTruthy();
  });
});

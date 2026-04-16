import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PhysioCard from 'src/components/PhysioCard';
import { PhysioWithJoins } from 'src/types';

const basePhysio: PhysioWithJoins = {
  id: 'physio-1',
  user_id: 'user-1',
  bio: 'Test bio',
  specialties: ['სპორტული', 'ზურგი'],
  languages: ['ქართული'],
  hourly_rate: 50,
  base_district_id: 'district-1',
  is_verified: true,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  user: { full_name: 'Nino Beridze', avatar_url: null },
  base_district: { id: 'district-1', name_en: 'Vake', name_ka: 'ვაკე', center: null },
  average_rating: 4.5,
  review_count: 12,
};

describe('PhysioCard', () => {
  it('renders physio name', () => {
    const { getByText } = render(<PhysioCard physio={basePhysio} onPress={() => {}} />);
    expect(getByText('Nino Beridze')).toBeTruthy();
  });

  it('renders district name in Georgian', () => {
    const { getByText } = render(<PhysioCard physio={basePhysio} onPress={() => {}} />);
    expect(getByText('ვაკე')).toBeTruthy();
  });

  it('renders hourly rate with Georgian currency symbol', () => {
    const { getByText } = render(<PhysioCard physio={basePhysio} onPress={() => {}} />);
    expect(getByText('₾50/სთ')).toBeTruthy();
  });

  it('shows verified badge when is_verified is true', () => {
    const { getByText } = render(<PhysioCard physio={basePhysio} onPress={() => {}} />);
    expect(getByText('დადასტურებული')).toBeTruthy();
  });

  it('does not show verified badge when is_verified is false', () => {
    const { queryByText } = render(
      <PhysioCard physio={{ ...basePhysio, is_verified: false }} onPress={() => {}} />,
    );
    expect(queryByText('დადასტურებული')).toBeNull();
  });

  it('calls onPress when card is tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<PhysioCard physio={basePhysio} onPress={onPress} />);
    // fireEvent traverses up to the TouchableOpacity ancestor
    fireEvent.press(getByText('Nino Beridze'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows specialties as pills', () => {
    const { getByText } = render(<PhysioCard physio={basePhysio} onPress={() => {}} />);
    expect(getByText('სპორტული')).toBeTruthy();
    expect(getByText('ზურგი')).toBeTruthy();
  });

  it('shows overflow pill when more than 2 specialties', () => {
    const physio = { ...basePhysio, specialties: ['სპორტული', 'ზურგი', 'ნევროლოგია'] };
    const { getByText } = render(<PhysioCard physio={physio} onPress={() => {}} />);
    expect(getByText('+1 დამატებით')).toBeTruthy();
  });

  it('shows rating and review count', () => {
    const { getByText } = render(<PhysioCard physio={basePhysio} onPress={() => {}} />);
    expect(getByText('★ 4.5 (12 შეფასება)')).toBeTruthy();
  });

  it('hides rating when average_rating is undefined', () => {
    const physio = { ...basePhysio, average_rating: undefined, review_count: undefined };
    const { queryByText } = render(<PhysioCard physio={physio} onPress={() => {}} />);
    expect(queryByText(/★/)).toBeNull();
  });

  it('shows initials avatar when no avatar_url', () => {
    const { getByText } = render(<PhysioCard physio={basePhysio} onPress={() => {}} />);
    expect(getByText('NB')).toBeTruthy();
  });

  it('does not render rate when hourly_rate is null', () => {
    const physio = { ...basePhysio, hourly_rate: null };
    const { queryByText } = render(<PhysioCard physio={physio} onPress={() => {}} />);
    expect(queryByText(/₾/)).toBeNull();
  });
});

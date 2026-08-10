import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { KA } from 'src/constants/strings.ka';
import supabase from 'src/lib/supabase';
import { District } from 'src/types';

type Props = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  singleSelect?: boolean;
};

export default function DistrictPicker({
  selectedIds,
  onChange,
  singleSelect = false,
}: Props) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDistricts() {
      const { data } = await supabase
        .from('districts')
        .select('id, name_en, name_ka, center')
        .order('name_ka');
      if (data) setDistricts(data as District[]);
      setLoading(false);
    }
    fetchDistricts();
  }, []);

  function handlePress(district: District) {
    if (singleSelect) {
      onChange(selectedIds[0] === district.id ? [] : [district.id]);
      return;
    }
    if (selectedIds.includes(district.id)) {
      onChange(selectedIds.filter((id) => id !== district.id));
    } else {
      onChange([...selectedIds, district.id]);
    }
  }

  if (loading) {
    return (
      <View className="py-6 items-center justify-center">
        <ActivityIndicator color="#0891b2" />
      </View>
    );
  }

  return (
    <View className="border border-gray-200 rounded-xl overflow-hidden">
      <Text className="text-xs text-gray-500 uppercase tracking-wide px-4 pt-3 pb-2">
        {singleSelect ? KA.districtPicker.selectDistrict : KA.districtPicker.selectDistricts}
      </Text>
      <ScrollView
        style={{ maxHeight: 200 }}
        nestedScrollEnabled
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        {districts.map((district) => {
          const isSelected = selectedIds.includes(district.id);
          return (
            <TouchableOpacity
              key={district.id}
              onPress={() => handlePress(district)}
              activeOpacity={0.7}
              className={`flex-row items-center justify-between px-4 py-3.5 border-b border-gray-100 ${
                isSelected ? 'bg-teal-50' : 'bg-white'
              }`}
            >
              <Text
                className={`text-base ${
                  isSelected ? 'text-teal-800 font-medium' : 'text-gray-800'
                }`}
              >
                {district.name_ka}
              </Text>
              {isSelected && <Text className="text-teal-600 text-base">✓</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

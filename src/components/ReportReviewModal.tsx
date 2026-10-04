import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { KA } from 'src/constants/strings.ka';
import { ReviewReportReason } from 'src/types';

const S = KA.reviewReport;

const REASONS: { value: ReviewReportReason; label: string }[] = [
  { value: 'spam', label: S.reasonSpam },
  { value: 'offensive', label: S.reasonOffensive },
  { value: 'fake', label: S.reasonFake },
  { value: 'other', label: S.reasonOther },
];

type Props = {
  visible: boolean;
  submitting: boolean;
  onClose: () => void;
  onSelect: (reason: ReviewReportReason) => void;
};

export default function ReportReviewModal({ visible, submitting, onClose, onSelect }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <Pressable className="bg-white rounded-t-3xl px-5 pt-5 pb-8" onPress={() => {}}>
          <Text className="text-base font-semibold text-gray-900 mb-1">{S.modalTitle}</Text>
          <Text className="text-sm text-gray-500 mb-4">{S.modalSubtitle}</Text>

          <View className="gap-2">
            {REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.value}
                onPress={() => onSelect(reason.value)}
                disabled={submitting}
                activeOpacity={0.7}
                className="flex-row items-center justify-between border border-gray-100 bg-gray-50 rounded-xl px-4 py-3.5"
              >
                <Text className="text-sm text-gray-800">{reason.label}</Text>
                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={onClose} disabled={submitting} className="mt-4 items-center py-2">
            <Text className="text-sm text-gray-500 font-medium">{S.cancel}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

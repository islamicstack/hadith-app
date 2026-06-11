import Ionicons from '@expo/vector-icons/Ionicons';
import { TouchableOpacity } from 'react-native';
import { useDrawer } from '../context/DrawerContext';

export function DrawerToggle({ color = '#C8A96E' }: { color?: string }) {
  const { openDrawer } = useDrawer();
  return (
    <TouchableOpacity
      onPress={openDrawer}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="menu-outline" size={24} color={color} />
    </TouchableOpacity>
  );
}

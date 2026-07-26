import { redirect } from 'next/navigation';

export default function ItemsPage() {
  redirect('/items/finished');
}

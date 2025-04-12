import { redirect } from 'next/navigation';

export default function NewPetRedirect() {
  redirect('/account/pets/add');
  return null;
} 
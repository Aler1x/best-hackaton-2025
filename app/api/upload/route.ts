import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    // Get current user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if the user is a shelter or volunteer
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get form data with the image
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' }, { status: 400 });
    }

    // Create a unique filename
    const fileName = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    
    // Define the storage path based on user role
    const path = userData.role === 'shelter' ? 'pets' : 'found-pets';
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('images')
      .upload(`${path}/${fileName}`, file, {
        contentType: file.type,
        cacheControl: '3600',
      });
    
    if (error) {
      console.error('Supabase storage error:', error);
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(`${path}/${fileName}`);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
} 
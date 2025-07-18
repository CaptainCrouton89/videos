import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';

// Initialize Supabase client
export function createSupabaseClient() {
  const supabaseUrl = 'https://yiwkbafldsqjvrktrlbu.supabase.co';
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseKey) {
    throw new Error('SUPABASE_ANON_KEY environment variable is required');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

// Initialize Supabase client with service role for uploads (bypasses RLS)
export function createSupabaseServiceClient() {
  const supabaseUrl = 'https://yiwkbafldsqjvrktrlbu.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

// Upload a local image file to Supabase Storage
export async function uploadImageToSupabase(filePath: string): Promise<string> {
  if (!filePath) {
    throw new Error('File path is required');
  }

  // Check if file exists
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`File not found: ${filePath}`);
  }

  // Check if it's a valid image file
  const ext = path.extname(filePath).toLowerCase();
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  if (!validExtensions.includes(ext)) {
    throw new Error(`Invalid image file type: ${ext}. Supported formats: ${validExtensions.join(', ')}`);
  }

  const supabase = createSupabaseServiceClient();
  
  // Read the file
  const fileBuffer = await fs.readFile(filePath);
  
  // Generate a unique filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `video-generation/${timestamp}_${path.basename(filePath)}`;
  
  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('images')
    .upload(fileName, fileBuffer, {
      contentType: getContentType(ext),
      upsert: false
    });

  if (error) {
    throw new Error(`Failed to upload image to Supabase: ${error.message}`);
  }

  // Get the public URL
  const { data: publicUrlData } = supabase.storage
    .from('images')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

// Helper function to get content type based on file extension
function getContentType(ext: string): string {
  switch (ext.toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.bmp':
      return 'image/bmp';
    case '.webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}

// Check if a string is a local file path (vs URL)
export function isLocalFilePath(imagePath: string): boolean {
  // Check if it's a URL
  try {
    new URL(imagePath);
    return false; // It's a valid URL
  } catch {
    // Not a URL, check if it's a local file path
    return path.isAbsolute(imagePath) || imagePath.startsWith('./') || imagePath.startsWith('../') || !imagePath.includes('://');
  }
}
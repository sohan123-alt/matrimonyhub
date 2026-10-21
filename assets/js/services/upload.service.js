import { CLOUDINARY } from '../config/cloudinary.js';

const MAX_MB = 5;

export async function uploadPhoto(file) {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  if (file.size > MAX_MB * 1024 * 1024) throw new Error('Image must be smaller than ' + MAX_MB + ' MB.');
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY.uploadPreset);
  fd.append('folder', 'matrimonyhub/profiles');
  const res = await fetch('https://api.cloudinary.com/v1_1/' + CLOUDINARY.cloudName + '/image/upload', { method: 'POST', body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Photo upload failed.');
  return json.secure_url;
}

// Cloudinary URL e resize + auto format/quality boshay
export function photoUrl(url, w = 400) {
  if (!url || !url.includes('/upload/')) return url;
  return url.replace('/upload/', '/upload/w_' + w + ',c_fill,g_face,q_auto,f_auto/');
}

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Vercel serverless function payload size limit is 4.5MB
    if (file.size > 4.5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds the 4.5MB limit' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    try {
      // Destination directory
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      
      // Ensure destination directory exists
      await fs.mkdir(uploadDir, { recursive: true });

      // Create a unique filename
      const ext = path.extname(file.name) || '.png';
      const uniqueName = `${Math.random().toString(36).substring(2, 11)}_${Date.now()}${ext}`;
      const filePath = path.join(uploadDir, uniqueName);

      // Write the buffer
      await fs.writeFile(filePath, buffer);

      return NextResponse.json({
        success: true,
        url: `/uploads/${uniqueName}`
      });
    } catch (fsErr) {
      console.warn("Local storage write failed, falling back to Base64 data URI:", fsErr);
      
      const base64String = buffer.toString('base64');
      const fileType = file.type || 'image/png';
      const dataUri = `data:${fileType};base64,${base64String}`;

      return NextResponse.json({
        success: true,
        url: dataUri
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'File upload failed' }, { status: 500 });
  }
}

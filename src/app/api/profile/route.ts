import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import TeamMember from '@/models/TeamMember';

export async function POST(req: Request) {
  try {
    const { userId, name, email } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        if (userId) {
          try {
            await User.findByIdAndUpdate(userId, { name: name.trim() });
            await TeamMember.updateMany({ userId }, { name: name.trim() });
          } catch (e) {}
        }
        if (email) {
          try {
            await User.updateMany({ email: email.toLowerCase() }, { name: name.trim() });
            await TeamMember.updateMany({ email: email.toLowerCase() }, { name: name.trim() });
          } catch (e) {}
        }
      } catch (e) {
        console.error('Error updating profile in MongoDB:', e);
      }
    }

    return NextResponse.json({ success: true, name: name.trim() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

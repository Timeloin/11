import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Team from '@/models/Team';
import { InventoryStore } from '@/lib/store';

// Default SVG App Icon for Simran Mobile
const DEFAULT_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4965fa"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <g transform="translate(136, 96)" filter="url(#shadow)">
    <!-- Smartphone body -->
    <rect x="0" y="0" width="240" height="320" rx="36" fill="#ffffff" stroke="#e2e8f0" stroke-width="4"/>
    <!-- Screen -->
    <rect x="16" y="28" width="208" height="240" rx="16" fill="#0f172a"/>
    <!-- Speaker / camera notch -->
    <circle cx="120" cy="14" r="4" fill="#94a3b8"/>
    <!-- Home bar / indicator -->
    <rect x="90" y="288" width="60" height="6" rx="3" fill="#cbd5e1"/>
    <!-- Screen content: lightning bolt & SM initials -->
    <path d="M128 64 L88 152 L120 152 L104 224 L160 136 L128 136 Z" fill="#38bdf8"/>
    <text x="120" y="250" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="20" fill="#ffffff" text-anchor="middle" letter-spacing="1">SIMRAN</text>
  </g>
</svg>`;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');

    let iconDataUrl: string | undefined;

    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        let team;
        if (teamId && teamId !== 'all') {
          team = await Team.findById(teamId).lean();
        }
        if (!team) {
          team = await Team.findOne({}).sort({ updatedAt: -1 }).lean();
        }
        if (team && (team as any).appIcon) {
          iconDataUrl = (team as any).appIcon;
        }
      } catch (e) {
        console.error('Error loading appIcon from DB:', e);
      }
    }

    if (!iconDataUrl) {
      const memoryTeam = await InventoryStore.getTeam(teamId || 'team_1');
      if (memoryTeam?.appIcon) {
        iconDataUrl = memoryTeam.appIcon;
      }
    }

    // If custom image data URL exists
    if (iconDataUrl && iconDataUrl.startsWith('data:')) {
      const matches = iconDataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        return new Response(buffer, {
          status: 200,
          headers: {
            'Content-Type': mimeType,
            'Content-Length': buffer.length.toString(),
            'Cache-Control': 'public, max-age=60, s-maxage=300',
          },
        });
      }
    }

    // Default SVG Icon
    return new Response(DEFAULT_SVG_ICON, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    });
  } catch (err: any) {
    return new Response(DEFAULT_SVG_ICON, {
      status: 200,
      headers: { 'Content-Type': 'image/svg+xml' },
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { teamId, appIcon } = body;

    if (!appIcon) {
      return NextResponse.json({ error: 'App icon image is required' }, { status: 400 });
    }

    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        let targetTeam;
        if (teamId) {
          targetTeam = await Team.findByIdAndUpdate(teamId, { appIcon }, { new: true });
        }
        if (!targetTeam) {
          targetTeam = await Team.findOneAndUpdate({}, { appIcon }, { new: true, sort: { updatedAt: -1 } });
        }
        if (!targetTeam) {
          await Team.create({
            name: 'Simran Mobile',
            inviteCode: 'SIMRAN88',
            appIcon,
          });
        }
      } catch (e: any) {
        console.error('Error saving appIcon to DB:', e);
      }
    }

    // Update in-memory fallback
    const memoryTeam = await InventoryStore.getTeam(teamId || 'team_1');
    if (memoryTeam) {
      memoryTeam.appIcon = appIcon;
    }

    return NextResponse.json({ success: true, appIcon });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

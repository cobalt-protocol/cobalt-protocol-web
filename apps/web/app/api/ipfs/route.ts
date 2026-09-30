import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const ipfsEndpoint = process.env.NEXT_PUBLIC_IPFS_API_URL || 'http://127.0.0.1:5001';

        const res = await fetch(`${ipfsEndpoint}/api/v0/add`, {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) {
            const errText = await res.text();
            return NextResponse.json({ error: `Kubo IPFS upload failed: ${errText}` }, { status: res.status });
        }

        const text = await res.text();
        const lines = text.trim().split('\n');
        const lastLine = lines[lines.length - 1] || '{}';
        const data = JSON.parse(lastLine);

        const cid = data.Hash || data.Cid?.['/'] || data.cid || '';

        return NextResponse.json({ cid, hash: cid, data });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Failed to upload to IPFS' }, { status: 500 });
    }
}

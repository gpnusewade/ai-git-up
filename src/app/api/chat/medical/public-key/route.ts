import { NextResponse } from 'next/server';
import { getPublicKey } from '../keys';

export async function GET() {
  return NextResponse.json({ publicKey: getPublicKey() });
}

import { NextRequest, NextResponse } from "next/server";

export async function GET(req : NextRequest,{params } : any) {
  const cookie = req.cookies.get('vercel')
  console.log(cookie)
  const res = {
    codename : "Simoba",
    name : "Si-Moba Sistem Mobile Bayuangga",
    url : "https://pudam-bayuangga.id"

  }
    return NextResponse.json(res ,{status : 200})     
}

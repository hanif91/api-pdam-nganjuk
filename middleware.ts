import { NextRequest, NextResponse } from 'next/server'
// import { sign, verify } from "jsonwebtoken"; 
import * as jose from 'jose';
import { verifyAuth } from './lib/auth';
// import { NextApiResponse } from 'next';



// Limit the middleware to paths starting with `/api/`
export const config = {
  matcher: '/api/mitra/:function*',
}
 
export async function middleware(request: NextRequest ) {
  const authHeader = request.headers.get('Authorization');
  const tokenHeader = authHeader?.replace("Bearer ","") || "";


  const isVerif  = await verifyAuth(tokenHeader);

  // console.log(isVerif);


  if (isVerif.status) {
    
    if (!isVerif.data?.kodeloket || !isVerif.data?.user || !isVerif.data?.pass) {
      return Response.json(
        { success: false,
          rescode: 402,
          message: 'Payload invalid' },
        { status: 401 }
      )      
    }

    const response = NextResponse.next()
    // // response.cookies.set('vercel', 'fastsadsa')
    // response.cookies.set({
    //   name: 'userauth',
    //   value: isVerif.data?.user,
    // })
    // response.cookies.set({
    //   name: 'passauth',
    //   value: isVerif.data?.pass,
    // })
    // response.cookies.set({
    //   name: 'loketauth',
    //   value: isVerif.data?.kodeloket,
    // })
    return response
  } else {
  
    return Response.json(
      { success: false,
        rescode : 401,
        message: 'Screet Key failed' },
      { status: 401 }
    )
  }

}
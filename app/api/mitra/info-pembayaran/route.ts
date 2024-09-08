import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prismadb from "@/lib/prismadb";
import { cookies } from 'next/headers'
import { verifyAuth } from '@/lib/auth';


export async function GET(req: NextRequest) { 
  try {
    let userAuth : string = "";
    let loketAuth : string = "";
    let passAuth : string = "";

    const authHeader = req.headers.get('Authorization');
    const tokenHeader = authHeader?.replace("Bearer ","") || "";
    const nopel = req.nextUrl.searchParams.get("no_pel");


    const isVerif  = await verifyAuth(tokenHeader);
    if (isVerif.status) {
      userAuth = isVerif.data?.user || "";
      loketAuth = isVerif.data?.kodeloket || "";  
      passAuth =  isVerif.data?.pass || "";     
    } else {
      return NextResponse.json(
        { success: false,
          rescode : 401,
          message: 'Screet Key failed' },
        { status: 401 }
      )     
    }

    const isVerifUser =  await prismadb.user.findUnique({
      where : {
        id : userAuth,
        pass : passAuth
      }
    });
    if (!isVerifUser) {
      return NextResponse.json(
        {
          rescode : 210,
          success : false,
          message : "User Tidak Terdaftar",
          data : {
            namauser : userAuth,
            passworduser : passAuth,
            kodeloket : loketAuth
          }
        }

        ,{status : 200})  
    }
    
    const isPel = await prismadb.customer.findUnique({
      where : {
        nosam :  nopel || "",
      }
    })
    if (!isPel) {
      return NextResponse.json(
        {
          rescode : 211,
          success : false,
          message : "No Pelanggan Tidak Terdaftar",
          data : {
            nopel : nopel || "" 
          }
        }

        ,{status : 200})  
    }
    
    const datatagihan : any[] = await prismadb.$queryRaw(
      Prisma.sql`call infobayar(${nopel})` 
    )
    
    if (!datatagihan || datatagihan.length === 0) {
      return NextResponse.json(
        {
          rescode : 401,
          success : false,
          message : "Tidak Ada Data atau Belum Lunas",
          data : {
            nopel : nopel || "" 
          }
        }

        ,{status : 200})  
    }

    // datatagihan.reverse()
    
    const resultDataTag = datatagihan.map(val => {
      const res = {
        periode : val.f1 ,
        golongan : val.f2 ,
        m3 : parseInt(val.f3),
        harga_air : parseInt(val.f4),
        administrasi : parseInt(val.f6),
        dana_meter : parseInt(val.f5),
        materai : parseInt(val.f7),
        denda : parseInt(val.f8),
        ppn : parseInt(val.f9),
        total_tagihan : parseInt(val.f10),
        user : val.f11
      }


      return res;
    })

    const result = 
    {
      rescode : 400,
      success : true,
      message : "Info Pembayaran Tersedia",
      data : {
        no_pelanggan : isPel.nosam,
        nama : isPel.nama,
        alamat : isPel.al,
        tagihan : resultDataTag
      }
    }



    return NextResponse.json(result,{status : 200})   

  } catch (error) {
    return NextResponse.json({
      rescode : 500,
      success : false,
      message : `General Error : ${error}`
    }, { status: 500 })
  }


}

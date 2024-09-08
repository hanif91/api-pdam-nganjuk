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
        pass : passAuth,
        // bag : loketAuth
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

    if (isPel.status !== "2") {
      return NextResponse.json(
        {
          rescode : 212,
          success : false,
          message : "No Pelanggan Non Aktif, Harap Ke Kantor PDAM",
          data : {
            nopel : nopel || "" 
          }
        }

        ,{status : 200})        
    }

    const dataper : any[] = await prismadb.$queryRaw(
      Prisma.sql`select date_format( date_add(current_Date, interval -1 month) ,"%Y%m") as dt` 
    )   
    const datatagihan : any[] = await prismadb.$queryRaw(
      Prisma.sql`call infotag(${nopel})` 
    )
    
    if (!datatagihan || datatagihan.length === 0) {
      return NextResponse.json(
        {
          rescode : 215,
          success : false,
          message : "Tagihan Sudah Lunas",
          data : {
            nopel : nopel || "" 
          }
        }

        ,{status : 200})  
    }
    // console.log(datatagihan);

    const lastIPer = datatagihan[datatagihan.length-1].f1;
    if (dataper[0].dt !== lastIPer ) {
      return NextResponse.json(
        {
          rescode : 216,
          success : false,
          message : "Tagihan Tidak Lancar, Harap Bayar Ke Kantor PDAM",
          data : {
            nopel : nopel || "" 
          }
        }

        ,{status : 200})  
    }

    const resultDataTag = datatagihan.map(val => {
      const res = {
        periode : val.f1 ,
        golongan : val.f2 ,
        stan_lalu : parseInt(val.f3),
        stan_ini : parseInt(val.f4),
        m3 : parseInt(val.f5),
        hargaair : parseInt(val.f6),
        administrasi : parseInt(val.f8),
        dana_meter : parseInt(val.f7),
        total_air : parseInt(val.f9),
        materai : parseInt(val.f10),
        denda : parseInt(val.f11),
        ppn : parseInt(val.f12),
        total_tagihan : parseInt(val.f13)
      }

      return res;
    })

    const result = 
    {
      rescode : 200,
      success : true,
      message : "Tagihan Tersedia",
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

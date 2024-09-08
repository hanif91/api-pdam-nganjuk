import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prismadb from "@/lib/prismadb";
import { cookies } from 'next/headers'
import { verifyAuth } from '@/lib/auth';


export async function POST(req: NextRequest) { 
  try {
    const body = await req.json();

    let userAuth : string = "";
    let loketAuth : string = "";
    let passAuth : string = "";

    const authHeader = req.headers.get('Authorization');
    const tokenHeader = authHeader?.replace("Bearer ","") || "";

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
       // cek user verifikasi
    const isVerifUser =  await prismadb.user.findUnique({
      where : {
        id : userAuth,
        pass : passAuth,
        // kodeloket : loketAuth
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
    
    if (!Array.isArray(body.periode) || !body.no_pelanggan)  {
      return NextResponse.json(
        { 
          rescode : 310,
          success: false,
          message: 'Data Body Invalid' },
        { status: 200 }
      )         
    }

    const isPel = await prismadb.customer.findUnique({
      where : {
        nosam :  body.no_pelanggan || "",
      }
    })
    if (!isPel) {
      return NextResponse.json(
        {
          rescode : 211,
          success : false,
          message : "No Pelanggan Tidak Terdaftar",
          data : {
            nopel : body.no_pelanggan || "" 
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
            nopel : body.no_pelanggan || "" 
          }
        }

        ,{status : 200})        
    }
    
    const dataper : any[] = await prismadb.$queryRaw(
      Prisma.sql`select date_format( date_add(current_Date, interval -1 month) ,"%Y%m") as dt` 
    )   

    const datatagihan : any[] = await prismadb.$queryRaw(
      Prisma.sql`call infotag(${body.no_pelanggan})` 
    )

    // console.log(datatagihan.length)
    if (!datatagihan || datatagihan.length === 0) {
      return NextResponse.json(
        {
          rescode : 215,
          success : false,
          message : "Tagihan Sudah Lunas",
          data : {
            nopel : body.no_pelanggan || "" 
          }
        }

        ,{status : 200})  
    }

        // cek Periode Lancar
    const lastIPer = datatagihan[datatagihan.length-1].f1;  
    if (dataper[0].dt !== lastIPer ) {
      return NextResponse.json(
        {
          rescode : 216,
          success : false,
          message : "Tagihan Tidak Lancar, Harap Bayar Ke Kantor PDAM",
          data : {
            nopel : body.no_pelanggan || "" 
          }
        }

        ,{status : 200})  
    } 




    const jmlperiode = body.periode.length;

    const jmldataTagihan = datatagihan.length;
    
    if (jmldataTagihan !== jmlperiode) {
      return NextResponse.json(
        {
          rescode : 311,
          success : false,
          message : "Jumlah Periode Tagihan Invalid",
          data : {
            periode : body.periode 
          }
        }

        ,{status : 200})  

    }

    const periodeTagihan = datatagihan.map(val => {
      return val.f1;
    })

    const periodeBody = body.periode;


    periodeBody.sort();
    periodeTagihan.sort();
    const isMatchPeriodeData = (JSON.stringify(periodeBody) === JSON.stringify(periodeTagihan));

    if (!isMatchPeriodeData) {
      return NextResponse.json(
        {
          rescode : 312,
          success : false,
          message : "Data Periode Tagihan Invalid",
          data : {
            periode : periodeBody
          }
        }

        ,{status : 200})  
    }

    let dataStsBayar =  [];
    let jmlgagalbayar = 0; 

    for (const dataTag of datatagihan) {
      const totalBayar = parseInt(dataTag.f13);
      const nosamb = dataTag.f0;
      const dendatunggakan = dataTag.f11;
      const ppn = dataTag.f12;
      const total = dataTag.f13;
      const periode = dataTag.f1; 
      try {

        const isBayar : any [] = await prismadb.$queryRaw(
          Prisma.sql`call bayartagihan(${nosamb},${periode},${isVerifUser.nama},${dendatunggakan},${ppn})` 
        )
        // console.log(isBayar);
        const coderespon = parseInt(isBayar[0].f0)
        if ( coderespon === 200) {
          const dumpDt = {
            periode : periode,
            status : "OK"
          }
          dataStsBayar.push(dumpDt)
        } else {
          jmlgagalbayar += 1;
          const dumpDt = {
            periode : periode,
            status : "GAGAL"
          }
          dataStsBayar.push(dumpDt);
        }

      } catch (error) {
        jmlgagalbayar += 1;
        const dumpDt = {
          periode : periode,
          status : "ERROR"
        }   
        dataStsBayar.push(dumpDt);     
      }      
    }

    // console.log(dataStsBayar)

    // dataStsBayar.reverse()

    let resCodeAkhir = 0;
    let messageAkhir = "";
    let succesAkhir = false;

    if (jmlgagalbayar > 0) {
      if (jmlgagalbayar === datatagihan.length) {
         resCodeAkhir = 399;
         messageAkhir = "Pembayaran Gagal";
         succesAkhir = false;
      } else {
        resCodeAkhir = 305;
        messageAkhir = "Pembayaran prematur / hanya sebagian Periode terlunasi";
        succesAkhir = false;
      }
    } else {
      resCodeAkhir = 300;
      messageAkhir = "Pembayaran Sukses";
      succesAkhir = true;
    }

    const result = 
    {
      rescode : resCodeAkhir,
      success : succesAkhir,
      message : messageAkhir,
      data : {

        no_pelanggan : isPel.nosam,
        periode :  dataStsBayar
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

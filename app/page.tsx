import Image from 'next/image'

export default function Home() {
  const res =  {
    app : "API MITRA PPOB Perumdam Trunojoo Sampang",
    versi : "Versi 1.0"
  }

  const result = JSON.stringify(res);
  return (result)
}

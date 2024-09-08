import Image from 'next/image'

export default function Home() {
  const res =  {
    app : "API PDAM NGANJUK",
    versi : "Versi 1.0"
  }

  const result = JSON.stringify(res);
  return (result)
}

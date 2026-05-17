import { useParams } from 'react-router-dom'

export default function ItemDetail() {
  const { id } = useParams()
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">Item Detail</h1>
      <p className="text-gray-500">Item ID: {id}</p>
    </main>
  )
}

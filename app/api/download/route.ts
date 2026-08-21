import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')
    const filename = searchParams.get('filename') || 'image.jpg'

    if (!imageUrl) {
      return new Response('Missing image URL', { status: 400 })
    }

    // Fetch the image from the external source (e.g. Supabase Storage)
    const response = await fetch(imageUrl)
    
    if (!response.ok) {
      return new Response(`Failed to fetch image from source: ${response.statusText}`, { status: 502 })
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error: any) {
    console.error('Error in download API:', error)
    return new Response(`Server error: ${error.message}`, { status: 500 })
  }
}

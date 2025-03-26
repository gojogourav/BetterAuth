import React from 'react'
import Image from 'next/image' // Remove this if you're using <img> elements

const columns = [
  [
    {
      src: "https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image.jpg",
      alt: "Gallery image 0"
    },
    {
      src: "https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image-1.jpg",
      alt: "Gallery image 1"
    },
    {
      src: "https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image-2.jpg",
      alt: "Gallery image 2"
    }
  ],
  [
    {
      src: "https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image-3.jpg",
      alt: "Gallery image 3"
    },
    {
      src: "https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image-4.jpg",
      alt: "Gallery image 4"
    },
    {
      src: "https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image-5.jpg",
      alt: "Gallery image 5"
    }
  ],
  [
    {
      src: "https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image-6.jpg",
      alt: "Gallery image 6"
    },
    {
      src: "https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image-7.jpg",
      alt: "Gallery image 7"
    },
    {
      src: "https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image-8.jpg",
      alt: "Gallery image 8"
    }
  ],
  [
    {
      src: "https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image-9.jpg",
      alt: "Gallery image 9"
    },
    {
      src: "https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image-10.jpg",
      alt: "Gallery image 10"
    },
    {
      src: "https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image-11.jpg",
      alt: "Gallery image 11"
    }
  ]
]

function Explore() {
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="grid gap-4">
            {column.map((image, imgIndex) => (
              <div key={imgIndex} className="h-auto max-w-full rounded-lg">
                <Image 
                  src={image.src} 
                  alt={image.alt} 
                  layout="responsive"
                  width={500}
                  height={300}
                  className="h-auto max-w-full rounded-lg"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Explore

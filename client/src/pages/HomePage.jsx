
import { useState, useEffect } from 'react';
import '../hero.css'

const slides = [
  {
    title: 'Discover Something New',
    description:
      'Explore our latest collections and find something you will love.',
    image:
      "public/slide_images/2-ingredient-candy-bars.jpg",
    buttonText: 'Explore Collection',
  },
  {
    title: 'New Milk Choclates',
    description:
      'Refresh your taste with timeless styles and seasonal favorites.',
    image:
      'public/slide_images/ChocolateFam_963aba64-9104-4da4-be24-55ff24efa296.webp',
    buttonText: 'Shop Now',
  },
  {
    title: 'Find Your Inspiration',
    description:
      'Discover new ideas and make every moment your own.',
    image:
      'public/slide_images/Homemade-Dark-Chocolate_-2.webp',
    buttonText: 'Discover More',
  },
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const previousSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + slides.length) % slides.length
    );
  };

  const slide = slides[currentSlide];

  return (
    <main>
      <section
        className="hero-slides"
        aria-label="Featured content"
        aria-roledescription="carousel"
      >
        <div className="hero-image-container">
          <img
            key={slide.image}
            src={slide.image}
            alt={slide.title}
            className="hero-image"
          />

          <div className="hero-overlay" />

          <div className="hero-content" aria-live="polite">
            <span className="hero-eyebrow">
              FEATURED COLLECTION
            </span>

            <h1>{slide.title}</h1>

            <p>{slide.description}</p>

            <button
              className="hero-cta"
              onClick={() => {
                // Replace with your collection or product route.
                window.location.href = '/shop';
              }}
            >
              {slide.buttonText}
            </button>
          </div>

          <button
            className="hero-arrow hero-arrow-left"
            onClick={previousSlide}
            aria-label="Previous slide"
          >
            &#10094;
          </button>

          <button
            className="hero-arrow hero-arrow-right"
            onClick={nextSlide}
            aria-label="Next slide"
          >
            &#10095;
          </button>

          <div className="hero-indicators">
            {slides.map((item, index) => (
              <button
                key={item.title}
                className={`hero-dot ${
                  index === currentSlide ? 'active' : ''
                }`}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={
                  index === currentSlide ? 'true' : undefined
                }
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}


import { useState, useEffect } from 'react';
import '../hero.css'
import SamplerPromo from '../components/home/SamplerPromo';
import SeasonalPicks from '../components/home/SeasonalPicks';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

const slides = [
  {
    title: 'Discover Something New',
    description:
      'Explore our latest collections and find something you will love.',
    image:
      "/B2B/images/2-ingredient-candy-bars.webp",
    buttonText: 'Explore Collection',
  },
  {
    title: 'New Milk Choclates',
    description:
      'Refresh your taste with timeless styles and seasonal favorites.',
    image:
      '/B2B/images/ChocolateFam_963aba64-9104-4da4-be24-55ff24efa296.webp',
    buttonText: 'Shop Now',
  },
  {
    title: 'Find Your Inspiration',
    description:
      'Discover new ideas and make every moment your own.',
    image:
      '/B2B/images/Homemade-Dark-Chocolate_-2.webp',
    buttonText: 'Discover More',
  },
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const { localePath } = useLanguage();

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
            width="1600"
            height="900"
            decoding="async"
            /* Phase 4: the first slide is the largest paint, so it loads first;
               the other slides are only fetched when they are shown */
            loading={currentSlide === 0 ? 'eager' : 'lazy'}
            fetchPriority={currentSlide === 0 ? 'high' : 'auto'}
          />

          <div className="hero-overlay" />

          <div className="hero-content" aria-live="polite">
            <span className="hero-eyebrow">
              FEATURED COLLECTION
            </span>

            <h1>{slide.title}</h1>

            <p>{slide.description}</p>

            <Link
              to={localePath('/catalog')}
              className="hero-cta"
            >
              {slide.buttonText}
            </Link>
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

      {/* Phase 2 demo feedback: promote the sampler builder on the homepage */}
      <SamplerPromo />
      {/* Seasonal cacao showcase, loaded from the catalog API */}
      <SeasonalPicks />
    </main>
  );
}

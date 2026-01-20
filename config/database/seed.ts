
import {
  libraries, users, stories,
  mediaItems, timelines, events,
  contactMessages, analytics,
  messageResponses,
  emailTemplates
} from "./schema";
import { hash } from "bcrypt";
import dbPool from "./db";
const { db } = dbPool;

async function seed() {
  console.log("Seeding database...");

  try {
    // Clear existing data before reseeding
    console.log("Clearing existing data...");

    // Drop tables in the reverse order of their dependencies
    await db.delete(analytics);
    await db.delete(contactMessages);
    await db.delete(events);
    await db.delete(timelines);
    await db.delete(mediaItems);
    await db.delete(stories);
    // await db.delete(users);
    await db.delete(libraries);
    await db.delete(emailTemplates);
    await db.delete(messageResponses);


    console.log("Database cleared successfully!");

    // Generate hashed passwords
    const adminPass = await hash("admin123", 10);
    const libraryAdminPass = await hash("pass123", 10);



    // Add librarys
    const [metMuseum] = await (db as any).insert(librarys).values({
      name: "Metropolitan Museum of Art",
      description: "One of the world's largest and finest art librarys, with a collection spanning 5,000 years of world culture.",
      location: "1000 Fifth Avenue",
      city: "New York",
      country: "USA",
      libraryType: "art",
      isActive: true,
      isApproved: true,
      isFeatured: true,
      logoUrl: "https://images.unsplash.com/photo-1503152394-c571994fd383?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80&q=80",
      featuredImageUrl: "https://images.unsplash.com/photo-1503152394-c571994fd383?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80",
      website: "https://www.metlibrary.org",
      contactEmail: "info@metlibrary.org",
      coordinates: { lat: 40.7794, lng: -73.9632 }
    }).returning();

    const [natMuseum] = await (db as any).insert(librarys).values({
      name: "National Gallery of History",
      description: "Explore artifacts spanning over 3,000 years of human civilization.",
      location: "Trafalgar Square",
      city: "London",
      country: "UK",
      logoUrl: "https://images.unsplash.com/photo-1576019820619-896eeb6a6a8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80",
      featuredImageUrl: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
      website: "https://www.nationalgallery.org.uk",
      isApproved: true,
      isActive: true,
      isFeatured: false,
      libraryType: "history",
      coordinates: { lat: 51.5089, lng: -0.1283 },
    }).returning();

    const [musIMuseum] = await (db as any).insert(librarys).values({
      name: "Museum of Science and Innovation",
      description: "Interactive exhibits showcasing technological advances through the ages.",
      location: "2-3-1 Aomi, Koto",
      city: "Tokyo",
      country: "Japan",
      logoUrl: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80",
      featuredImageUrl: "https://images.unsplash.com/photo-1594184888386-ddc5e5f0ff3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
      website: "https://www.miraikan.jst.go.jp/en/",
      isApproved: true,
      isActive: true,
      isFeatured: false,
      libraryType: "science",
      coordinates: { lat: 35.6196, lng: 139.7782 },
    }).returning();

    const [louvreMuseum] = await (db as any).insert(librarys).values({
      name: "Louvre Museum",
      description: "The world's largest art library and a historic monument in Paris, France.",
      location: "Rue de Rivoli",
      city: "Paris",
      country: "France",
      libraryType: "art",
      isActive: true,
      isApproved: true,
      isFeatured: true,
      logoUrl: "https://images.unsplash.com/photo-1602471615287-d733c59b79c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80&q=80",
      featuredImageUrl: "https://images.unsplash.com/photo-1602471615287-d733c59b79c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80",
      website: "https://www.louvre.fr",
      contactEmail: "info@louvre.fr",
      coordinates: { lat: 48.8606, lng: 2.3376 }
    }).returning();

    const [britishMuseum] = await (db as any).insert(librarys).values({
      name: "British Museum",
      description: "A public library dedicated to human history, art and culture, located in London.",
      location: "Great Russell Street",
      city: "London",
      country: "United Kingdom",
      libraryType: "history",
      isActive: true,
      isApproved: true,
      isFeatured: false,
      logoUrl: "https://images.unsplash.com/photo-1485842295075-1c7b2037114c?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80&q=80", 
      featuredImageUrl: "https://images.unsplash.com/photo-1485842295075-1c7b2037114c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80",
      website: "https://www.britishlibrary.org",
      contactEmail: "info@britishlibrary.org",
      coordinates: { lat: 51.5194, lng: -0.1269 }
    }).returning();

    const [modernMuseum] = await (db as any).insert(librarys).values({
      name: "Museum of Modern Art",
      description: "One of the largest and most influential librarys of modern art in the world.",
      location: "11 West 53rd Street",
      city: "New York",
      country: "USA",
      libraryType: "modern",
      isActive: true,
      isApproved: false,
      isFeatured: false,
      logoUrl: "https://images.unsplash.com/photo-1492136344046-866c85e0bf04?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80&q=80",
      featuredImageUrl: "https://images.unsplash.com/photo-1492136344046-866c85e0bf04?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80",
      website: "https://www.moma.org",
      contactEmail: "info@moma.org",
      coordinates: { lat: 40.7614, lng: -73.9776 }
    }).returning();



    const [superAdmin] = await (db as any).insert(users).values({
      username: "superadmin",
      password: adminPass,
      email: "superadmin@libraryconnect.com",
      fullName: "System Administrator",
      role: "super_admin",
      isActive: true,
      libraryId: null,
    }).returning();

    // Add library admins
    await (db as any).insert(users).values({
      username: "sarah",
      password: libraryAdminPass,
      email: "sarah@metlibrary.org",
      fullName: "Sarah Johnson",
      role: "library_admin",
      isActive: true,
      libraryId: metMuseum.id,
    });

    await (db as any).insert(users).values({
      username: "pierre",
      password: libraryAdminPass,
      email: "pierre@louvre.fr",
      fullName: "Pierre Dupont",
      role: "library_admin",
      isActive: true,
      libraryId: louvreMuseum.id,
    });

    await (db as any).insert(users).values({
      username: "james",
      password: libraryAdminPass,
      email: "james@britishlibrary.org",
      fullName: "James Wilson",
      role: "library_admin",
      isActive: true,
      libraryId: britishMuseum.id,
    });

    // Add stories
    const [monaLisaStory] = await (db as any).insert(stories).values({
      title: "The Enigmatic Smile: Unveiling the Mona Lisa",
      summary: "Explore the history and mysteries behind Leonardo da Vinci's masterpiece.",
      content: `<h2>The Mona Lisa: A Masterpiece Shrouded in Mystery</h2>
      <p>Leonardo da Vinci's Mona Lisa is perhaps the most famous painting in the world. Completed in the early 16th century, this portrait has captivated viewers for over 500 years with its enigmatic smile and technical brilliance.</p>
      <h3>A Revolutionary Portrait</h3>
      <p>The Mona Lisa exemplifies Leonardo's technique of sfumato, where colors and tones gradually blend into one another, creating a soft, hazy effect particularly noticeable around the subject's eyes and mouth. This innovative approach to painting helped create the mysteriously ambiguous expression that has fascinated viewers for centuries.</p>
      <p>Leonardo's use of an imaginary landscape background was also groundbreaking for portrait painting of the time, showing his deep understanding of atmospheric perspective and geology.</p>
      <h3>The Subject's Identity</h3>
      <p>Most scholars agree that the portrait depicts Lisa Gherardini, the wife of Florentine merchant Francesco del Giocondo - hence the painting's alternative Italian title "La Gioconda." However, various theories about the subject's identity have emerged over the centuries, adding to the painting's mystique.</p>
      <h3>Global Icon</h3>
      <p>Today, housed in the Louvre Museum in Paris, the Mona Lisa attracts millions of visitors annually. Its cultural significance extends far beyond the art world, having inspired countless references in literature, film, and popular culture.</p>`,
      libraryId: louvreMuseum.id,
      featuredImageUrl: "https://images.unsplash.com/photo-1572537133037-d93cc692a5ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80",
      isApproved: true,
      isFeatured: true,
      isPublished: true,
      publishedAt: new Date(),
      tags: ["Renaissance", "Da Vinci", "Portrait", "Italian"]
    }).returning();

    const [rosettaStoneStory] = await (db as any).insert(stories).values({
      title: "The Rosetta Stone: Key to Ancient Egyptian Hieroglyphs",
      summary: "How a single artifact changed our understanding of ancient Egyptian civilization.",
      content: `<h2>The Rosetta Stone: Unlocking an Ancient Civilization</h2>
      <p>Discovered in 1799 by soldiers in Napoleon's army, the Rosetta Stone proved to be the key that unlocked the mysteries of ancient Egyptian hieroglyphics.</p>
      <h3>A Trilingual Text</h3>
      <p>What makes the Rosetta Stone so significant is that it contains the same text in three different scripts: hieroglyphic, demotic (a simplified form of ancient Egyptian hieroglyphics), and ancient Greek. Since scholars could read ancient Greek, the stone provided a way to decipher hieroglyphics, a writing system that had been indecipherable for around 1,500 years.</p>
      <h3>The Breakthrough</h3>
      <p>It was French scholar Jean-François Champollion who, in 1822, finally made the breakthrough in deciphering hieroglyphics using the Rosetta Stone. His work opened up a whole new understanding of ancient Egyptian civilization, allowing historians to read countless texts that had previously been incomprehensible.</p>
      <h3>Cultural Significance</h3>
      <p>Today, the Rosetta Stone is one of the most visited objects in the British Museum and remains a powerful symbol of human ingenuity and the quest for knowledge. The term "Rosetta Stone" has even entered everyday language, referring to any key that helps decipher something previously unintelligible.</p>`,
      libraryId: britishMuseum.id,
      featuredImageUrl: "https://images.unsplash.com/photo-1560072810-1cffb09faf0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80",
      isApproved: true,
      isFeatured: true,
      isPublished: true,
      publishedAt: new Date(),
      tags: ["Ancient Egypt", "Archaeology", "Language", "Hieroglyphics"]
    }).returning();

    const [vanGoghStory] = await (db as any).insert(stories).values({
      title: "Van Gogh's Starry Night: A Window to His Mind",
      summary: "Exploring the emotional depths and artistic vision behind Vincent van Gogh's iconic masterpiece.",
      content: `<h2>The Starry Night: Van Gogh's Vision of Cosmic Wonder</h2>
      <p>Created in June 1889, The Starry Night is Vincent van Gogh's most famous work and one of the most recognized paintings in Western culture. It depicts a view from his asylum room window at Saint-Rémy-de-Provence, just before sunrise, with the addition of an idealized village.</p>
      <h3>Creation in Confinement</h3>
      <p>Van Gogh painted The Starry Night during his 12-month stay at the asylum of Saint-Paul-de-Mausole, where he had admitted himself after the infamous ear incident. Despite his mental struggles, this period was one of his most productive, creating over 150 paintings including this masterpiece.</p>
      <h3>Emotional Expression</h3>
      <p>The painting's swirling patterns and vibrant colors reflect Van Gogh's emotional state and his unique vision. Art historians often interpret the turbulent sky as reflecting his inner turmoil, while others see a profound expression of hope found in the eternal cosmos above a sleeping village.</p>
      <h3>Artistic Innovation</h3>
      <p>The Starry Night showcases Van Gogh's innovative brushwork, with its distinctive thick impasto style and swirling forms. Though he considered this work a failure at the time, it has become a cornerstone of expressionism and one of the most influential paintings of the modern era.</p>`,
      libraryId: modernMuseum.id,
      featuredImageUrl: "https://images.unsplash.com/photo-1579541671172-43429ce17aca?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80",
      isApproved: false,
      isFeatured: false,
      isPublished: false,
      publishedAt: new Date(),
      tags: ["Post-Impressionism", "Van Gogh", "Landscape", "Night Sky"]
    }).returning();

    const [TutankhamunStory] = await (db as any).insert(stories).values({
      title: "The Discovery of Tutankhamun's Tomb: A Century Later",
      content: `<div class="story-content">
        <p class="lead">On November 4, 1922, Howard Carter's team made one of the most significant archaeological discoveries of the 20th century when they uncovered the entrance to Tutankhamun's tomb in the Valley of the Kings.</p>
        
        <h3>The Moment of Discovery</h3>
        <p>Carter famously described what he saw when he first peered into the tomb: "Yes, wonderful things!" The tomb contained over 5,000 artifacts, including the famous golden burial mask, chariots, weapons, clothing, and furniture—all remarkably preserved after more than 3,000 years.</p>
        
        <h3>The Boy King's Legacy</h3>
        <p>Tutankhamun ruled Egypt from approximately 1332 to 1323 BCE during the 18th Dynasty. Despite his short reign and relatively minor historical impact, his tomb's discovery provided unprecedented insight into ancient Egyptian burial practices and royal life.</p>
        
        <h3>Conservation Challenges</h3>
        <p>The artifacts required extensive conservation work. Many items were fragile after millennia underground, and the excavation took nearly a decade to complete. Today, advanced techniques including CT scanning and 3D modeling help us understand these treasures without causing damage.</p>
        
        <h3>Modern Impact</h3>
        <p>The discovery sparked worldwide Egyptomania and fundamentally changed our understanding of ancient Egyptian civilization. It demonstrated the sophistication of their craftsmanship and the elaborate nature of royal burials.</p>
      </div>`,
      summary: "Explore the centennial legacy of Howard Carter's discovery of Tutankhamun's tomb and its lasting impact on archaeology and our understanding of ancient Egypt.",
      libraryId: louvreMuseum.id,
      featuredImageUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
      isPublished: true,
      isApproved: true,
      isFeatured: true,
      tags: ["Archaeology", "Ancient Egypt", "Tutankhamun", "Discovery"],
    }).returning();

    const [MedievalStory] = await (db as any).insert(stories).values({
      title: "Medieval Manuscripts: Illuminating the Dark Ages",
      content: `<div class="story-content">
        <p class="lead">Contrary to their name, the "Dark Ages" were a period of remarkable artistic and intellectual achievement, as evidenced by the stunning illuminated manuscripts preserved in our collection.</p>
        
        <h3>The Art of Illumination</h3>
        <p>Medieval scribes and artists created some of the most beautiful books ever made. These manuscripts combined religious devotion with artistic excellence, featuring gold leaf, vibrant pigments, and intricate decorative borders that took months or years to complete.</p>
        
        <h3>The Book of Kells</h3>
        <p>Perhaps the most famous illuminated manuscript, the Book of Kells (c. 800 CE) contains the four Gospels with extraordinary decorative detail. Each page demonstrates the sophisticated artistic traditions of Celtic monasteries and their fusion with Christian iconography.</p>
        
        <h3>Scientific Preservation</h3>
        <p>Modern conservation techniques help preserve these fragile documents. Controlled lighting, temperature, and humidity protect the organic materials—parchment, ink, and paint—from deterioration. Digital imaging now allows scholars worldwide to study these treasures without physical access.</p>
        
        <h3>Hidden Knowledge</h3>
        <p>Many manuscripts contain marginalia—notes, drawings, and commentaries added by medieval readers. These annotations provide insight into how people understood and interpreted texts, revealing the intellectual life of medieval society beyond the official narratives.</p>
        
        <h3>Cultural Exchange</h3>
        <p>Illuminated manuscripts demonstrate the extensive cultural exchange in medieval Europe. Islamic geometric patterns, Byzantine artistic techniques, and local folk traditions all influenced these works, showing that the medieval world was far more connected than often assumed.</p>
      </div>`,
      summary: "Explore the sophisticated artistry and hidden knowledge within medieval illuminated manuscripts, revealing the rich intellectual and cultural life of the so-called Dark Ages.",
      libraryId: metMuseum.id,
      featuredImageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
      isPublished: true,
      isApproved: true,
      isFeatured: true,
      tags: ["Medieval History", "Manuscripts", "Art", "Christianity"],
    }).returning();

    const [AntikytheraStory] = await (db as any).insert(stories).values({
      title: "The Antikythera Mechanism: Ancient Computer Revealed",
      content: `<div class="story-content">
        <p class="lead">Discovered in a Roman shipwreck in 1901, the Antikythera Mechanism has revolutionized our understanding of ancient Greek technological sophistication, revealing capabilities that wouldn't be seen again for over a millennium.</p>
        
        <h3>An Unexpected Discovery</h3>
        <p>Greek sponge divers found the corroded bronze device among treasures from a first-century BCE shipwreck off the island of Antikythera. For decades, its purpose remained mysterious, with some dismissing it as a simple astrolabe or navigational instrument.</p>
        
        <h3>Mechanical Marvel</h3>
        <p>Modern analysis using CT scanning and 3D modeling has revealed an intricate system of at least 37 bronze gears. This analog computer could predict the positions of the sun, moon, and planets, as well as lunar and solar eclipses, with remarkable accuracy.</p>
        
        <h3>Scientific Sophistication</h3>
        <p>The mechanism incorporated advanced mathematical concepts including the Metonic cycle (235 lunar months = 19 solar years) and the Callippic cycle. It demonstrates that ancient Greeks possessed sophisticated understanding of astronomical cycles and mechanical engineering.</p>
        
        <h3>Technological Timeline</h3>
        <p>Nothing comparable to the Antikythera Mechanism appears in the historical record until mechanical astronomical clocks in medieval Europe—over 1,000 years later. This gap suggests either that similar devices were lost to history or that the mechanism represents unique technological achievement.</p>
        
        <h3>Modern Reconstructions</h3>
        <p>Engineers and historians have built working replicas based on the surviving fragments and ancient astronomical knowledge. These reconstructions confirm the device's remarkable capabilities and highlight the ingenuity of its unknown creators.</p>
        
        <h3>Ongoing Research</h3>
        <p>New imaging techniques continue to reveal inscriptions and mechanical details. Recent discoveries include a 223-month eclipse prediction cycle and evidence of planetary motion calculations, suggesting the device was even more sophisticated than previously thought.</p>
      </div>`,
      summary: "The Antikythera Mechanism reveals ancient Greek technological sophistication far beyond what was thought possible, functioning as the world's first analog computer.",
      libraryId: metMuseum.id,
      featuredImageUrl: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
      isPublished: true,
      isApproved: true,
      isFeatured: true,
      tags: ["Ancient Greece", "Technology", "Archaeology", "Astronomy"],
    }).returning();

    const [MarieCurieStory] = await (db as any).insert(stories).values({
      title: "Marie Curie's Laboratory: Radioactivity's Pioneer",
      content: `<div class="story-content">
        <p class="lead">Marie Curie's laboratory equipment, still radioactive after more than a century, provides tangible connection to the groundbreaking research that earned her two Nobel Prizes and revolutionized our understanding of atomic physics.</p>
        
        <h3>Breaking Barriers</h3>
        <p>Marie Curie (1867-1934) was the first woman to win a Nobel Prize, the first person to win Nobel Prizes in two different sciences (Physics in 1903, Chemistry in 1911), and remains the only person to achieve this distinction across different scientific disciplines.</p>
        
        <h3>The Discovery of Radium</h3>
        <p>Working with her husband Pierre in a converted shed, Curie processed tons of pitchblende ore to isolate radium. The painstaking work involved stirring boiling masses with iron rods nearly as tall as herself, demonstrating both scientific dedication and physical endurance.</p>
        
        <h3>Laboratory Artifacts</h3>
        <p>Curie's notebooks, laboratory equipment, and even her cookbooks remain radioactive today, requiring special storage in lead-lined boxes. These artifacts will remain hazardous for another 1,500 years, a testament to her pioneering work with radioactive materials.</p>
        
        <h3>Medical Applications</h3>
        <p>Curie recognized the medical potential of radioactivity early on. During World War I, she developed mobile X-ray units called "petites Curies," personally driving them to the front lines and training military doctors in their use, saving countless lives.</p>
        
        <h3>Scientific Legacy</h3>
        <p>Her research laid the foundation for atomic physics, nuclear chemistry, and modern medical treatments including cancer radiotherapy. The element Curium and the unit of radioactivity Curie are named in her honor.</p>
        
        <h3>Personal Sacrifice</h3>
        <p>Curie's dedication to science ultimately cost her life—she died of aplastic anemia, likely caused by radiation exposure. Her sacrifice highlighted the need for safety protocols in scientific research and demonstrated the courage required for groundbreaking discovery.</p>
      </div>`,
      summary: "Marie Curie's radioactive laboratory artifacts tell the story of groundbreaking scientific discovery, personal sacrifice, and the dawn of the atomic age.",
      libraryId: modernMuseum?.id,
      featuredImageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
      isPublished: true,
      isApproved: true,
      isFeatured: false,
      tags: ["Marie Curie", "Physics", "Chemistry", "Women in Science"],
    }).returning();


    // Add media items
    await (db as any).insert(mediaItems).values({
      title: "Mona Lisa Portrait Close-Up",
      description: "A detailed close-up of the famous enigmatic smile",
      url: "https://images.unsplash.com/photo-1544624513-0a95dba48b75?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80",
      libraryId: louvreMuseum.id,
      mediaType: "image",
      isApproved: true,
      galleryId: "paintings",


      tags: ["Mona Lisa", "Da Vinci", "Detail"]
    });




    await (db as any).insert(mediaItems).values({
      title: "The Louvre Pyramid",
      description: "Modern entrance to the ancient library",
      url: "https://images.unsplash.com/photo-1549066014-e659339c2c18?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80",
      libraryId: louvreMuseum.id,
      mediaType: "image",
      isApproved: true,
      galleryId: "architecture",
      tags: ["Architecture", "Modern", "Glass"]
    });

    await (db as any).insert(mediaItems).values({
      title: "Rosetta Stone Detail",
      description: "Close-up showing the three scripts",
      url: "https://images.unsplash.com/photo-1590733840202-94a964c38292?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80",
      libraryId: britishMuseum.id,
      mediaType: "image",
      isApproved: true,
      galleryId: "ancient-egypt",
      tags: ["Rosetta Stone", "Hieroglyphics", "Ancient Egypt"]
    });

    await (db as any).insert(mediaItems).values({
      title: "Starry Night Gallery View",
      description: "Van Gogh's masterpiece on display",
      url: "https://images.unsplash.com/photo-1541680670548-88e8cd23c0f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80",
      libraryId: modernMuseum.id,
      mediaType: "image",
      isApproved: false,
      galleryId: "van-gogh",


      tags: ["Van Gogh", "Starry Night", "Gallery"]
    });

    await (db as any).insert(emailTemplates).values({
      name: "School Visit Response",
      subject: "Re: School Visit Inquiry - Educational Tours Available",
      libraryId: modernMuseum.id,
      content: `
        <h2>Thank you for your interest in educational visits!</h2>
        <p>Dear {{visitorName}},</p>
        <p>We're excited to learn about your interest in bringing students to {{libraryName}}. Our education department offers specialized programs designed specifically for high school students.</p>
        
        <h3>What we offer:</h3>
        <ul>
          <li>Guided tours with certified education specialists</li>
          <li>Interactive workshops and hands-on activities</li>
          <li>Curriculum-aligned content for art history and visual arts</li>
          <li>Group rates and flexible scheduling</li>
        </ul>
        
        <p>Our education coordinator will contact you within 2 business days to discuss your specific needs and schedule your visit.</p>
        
        <p>Best regards,<br>
        {{libraryName}} Education Team</p>
      `,
      isDefault: false
    });

    await (db as any).insert(emailTemplates).values({
      name: "General Inquiry Response",
      subject: "Thank you for contacting {{libraryName}}",
      libraryId: britishMuseum.id,
      content: `
        <h2>Thank you for reaching out!</h2>
        <p>Dear {{visitorName}},</p>
        <p>We've received your message regarding: {{originalSubject}}</p>
        <p>{{responseMessage}}</p>
        <p>If you have any additional questions, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br>
        The {{libraryName}} Team</p>
      `,
      isDefault: true
    });

    // Add timeline for Mona Lisa story
    await (db as any).insert(timelines).values({
      title: "The Journey of the Mona Lisa",
      description: "How this famous painting traveled through time and across nations",
      storyId: monaLisaStory.id,
      timelinePoints: [
        {
          id: "1",
          date: "1503",
          title: "Creation Begins",
          description: "Leonardo da Vinci begins painting the Mona Lisa in Florence, Italy."
        },
        {
          id: "2",
          date: "1516",
          title: "Arrives in France",
          description: "Leonardo brings the painting to France at the invitation of King Francis I."
        },
        {
          id: "3",
          date: "1797",
          title: "Displayed at the Louvre",
          description: "After the French Revolution, the painting is moved to the Louvre Museum."
        },
        {
          id: "4",
          date: "1911",
          title: "Famous Theft",
          description: "The painting is stolen from the Louvre by Vincenzo Peruggia."
        },
        {
          id: "5",
          date: "1913",
          title: "Recovery",
          description: "The painting is recovered in Italy and returned to the Louvre."
        },
        {
          id: "6",
          date: "Present",
          title: "Global Icon",
          description: "Now one of the most famous and valuable paintings in the world."
        }
      ],



    });

    // Add events
    await (db as any).insert(events).values({
      title: "Mona Lisa: Beyond the Smile",
      description: "A special exhibition exploring the techniques and history of Leonardo's masterpiece",
      libraryId: louvreMuseum.id,
      location: "Sully Wing, Room 711",
      eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      isApproved: true,
      isPublished: true,
      imageUrl: "https://images.unsplash.com/photo-1549066014-e659339c2c18?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80",
      createdAt: new Date()
    });

    await (db as any).insert(events).values({
      title: "Ancient Egyptian Hieroglyphics Workshop",
      description: "Learn to read and write basic hieroglyphics with our expert Egyptologists",
      libraryId: britishMuseum.id,
      location: "Education Center, Room B",
      eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Same day
      isApproved: true,
      isPublished: true,
      imageUrl: "https://images.unsplash.com/photo-1569524218-7a911602f07a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80",
      createdAt: new Date()
    });

    // Add contact messages
    await (db as any).insert(contactMessages).values({
      name: "John Smith",
      email: "john.smith@example.com",
      subject: "Group Visit Inquiry",
      message: "I would like to organize a school visit for 25 students in June. Could you please send me information about educational tours and pricing?",
      libraryId: metMuseum.id,
      isRead: false,
      createdAt: new Date()
    });

    await (db as any).insert(contactMessages).values({
      name: "Marie Dubois",
      email: "marie.dubois@example.fr",
      subject: "Accessibility Question",
      message: "I am planning to visit next month and would like to know what accessibility accommodations you have for wheelchair users. Thank you!",
      libraryId: louvreMuseum.id,
      isRead: true,
      createdAt: new Date()
    });

    // Add analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await (db as any).insert(analytics).values({
      date: today,
      libraryId: louvreMuseum.id,
      storyId: monaLisaStory.id,
      pageType: "story",
      views: 243
    });

    await (db as any).insert(analytics).values({
      date: today,
      libraryId: britishMuseum.id,
      storyId: rosettaStoneStory.id,
      pageType: "story",
      views: 187
    });

    await (db as any).insert(analytics).values({
      date: today,
      libraryId: louvreMuseum.id,
      storyId: monaLisaStory?.id,
      pageType: "home",
      views: 856
    });

    await (db as any).insert(analytics).values({
      date: today,
      libraryId: britishMuseum.id,
      storyId: rosettaStoneStory?.id,
      pageType: "home",
      views: 723
    });

    console.log("Database successfully seeded!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log("Seeding completed successfully");
    // Exit process if running as a script
    if (require.main === module) {
      process.exit(0);
    }
  })
  .catch(error => {
    console.error(error);
    if (require.main === module) {
      process.exit(1);
    }
  });

export { seed };
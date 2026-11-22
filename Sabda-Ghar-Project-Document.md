# Sabda Ghar
## A Community-Powered English, Nepali and Doteli Dictionary

**Project document**

**Live application:** http://127.0.0.1:4173

---

## Executive Summary

Sabda Ghar means “House of Words.” It is a digital community dictionary designed to preserve and teach Doteli, the language of Nepal’s Sudurpashchim Province.

The application connects English, Nepali and Doteli in one searchable learning system. Users can:

- Search words in English, Nepali, Roman Nepali or Doteli
- Listen to Nepali pronunciations
- Read and listen to community-contributed Doteli words
- Add missing words and regional variants
- Record or upload Doteli voice samples
- Learn with picture-based lessons
- Verify language contributions in reviewer mode
- Continue using the app offline through saved data and a service worker

The current project demonstrates a complete prototype: a working frontend, Node.js backend, JSON-based language database, Cloudinary audio storage, offline support and interactive learning experiences.

---

## 1. Problem

Doteli is widely used in everyday conversation in Sudurpashchim, but it has limited written and digital learning resources. Many regional words live mainly in speech and are passed between relatives and communities.

Key challenges include:

- A lack of accessible digital dictionaries
- Few standard teaching tools for Doteli
- Regional differences in vocabulary and pronunciation
- Limited audio resources for correct pronunciation
- Risk of vocabulary loss among younger generations
- Dependence on outside institutions for language documentation
- Few platforms that allow native speakers to contribute directly

The problem is not only translation. It is also representation, participation and preservation.

---

## 2. Inspiration

Sabda Ghar was inspired by a simple idea:

> Every word carries family memory, place and identity.

Elders use Doteli with younger family members, but that spoken knowledge is rarely collected into a permanent, searchable and shareable resource. The project was created to place language preservation in the hands of the community instead of leaving it to a small group of experts.

The app also draws inspiration from:

- Community-contributed encyclopedias
- Visual language-learning applications
- Audio-first cultural archives
- Nepal’s linguistic and regional diversity
- The belief that technology can protect—not replace—spoken tradition

---

## 3. Solution

Sabda Ghar provides a single accessible platform that combines a dictionary, a voice archive and a learning system.

### Dictionary

The dictionary allows users to search English, Nepali, Romanized Nepali and Doteli terms. It also supports missing-word checks and regional Doteli forms.

### Community contributions

Users can add:

- A Doteli word
- The district or area where it is used
- Their contributor name
- A voice recording
- An uploaded personal audio file

### Verification

Community additions remain separate from verified entries. Reviewer mode allows trusted users to:

- Mark text entries as verified
- Mark voice recordings as verified
- Remove inappropriate or incorrect entries

### Learning

The Learn section provides:

- Duolingo-style picture cards
- Lesson categories
- Nepali and Doteli learning modes
- Multiple-choice exercises
- Hearts and XP
- Local streak and progress tracking
- Unlockable lesson progression

---

## 4. Live Demonstration

The running prototype is available at:

**http://127.0.0.1:4173**

### Suggested demonstration flow

1. Open the home page and explain the purpose of Sabda Ghar.
2. Search for a word such as **water** or **पानी**.
3. Show the English, Nepali and Doteli values.
4. Play a Nepali pronunciation or an available Doteli recording.
5. Use **Only words missing Doteli** to show preservation opportunities.
6. Demonstrate adding a Doteli meaning and region.
7. Open the **Learn** page and select a picture lesson.
8. Complete an exercise and show XP and streak tracking.
9. Explain offline caching and PWA installation.
10. If appropriate, demonstrate reviewer mode using the configured reviewer key.

### Current pilot content

| Resource | Current size |
|---|---:|
| English dictionary words | 45 |
| Doteli text entries | 45 |
| Doteli entries with audio | 42 |
| Verified Doteli entries | 0 in the current draft dataset |
| Picture cards | 60 |
| Learning lessons | 7 |

The verified count reflects the prototype’s community-review stage; the app is intentionally designed to distinguish draft, community-added and verified entries.

---

## 5. Languages and Data

### Languages supported

| Language | Purpose |
|---|---|
| English | Source language for international and learner access |
| Nepali | National bridge language and spoken-listening support |
| Doteli | Core community language being documented |
| Roman Nepali | Accessible spelling and search support |

### Data structure

The main word collection is stored in `data/words.json`. Each word has:

- A unique ID
- An English form
- A Nepali form
- An optional Roman Nepali form
- A list of Doteli entries

Each Doteli entry can include:

- Doteli text
- District or region
- Contributor name
- Verification status
- Source link
- Audio URL
- Audio public ID
- Audio verification status

The lesson module uses `data/cards.json`, with separate picture cards and lesson groups.

---

## 6. Technology Stack

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript
- Responsive and mobile-first layouts
- Browser Speech Synthesis API
- MediaRecorder and microphone APIs
- Progressive Web App features

### Backend

- **Node.js**
- Node.js built-in `http` module
- Custom API routes
- Environment configuration with `dotenv`

### Database and storage

- JSON file storage using `data/words.json`
- Browser `localStorage` for offline copies, progress and streaks
- **Cloudinary** for uploaded and recorded audio
- No XAMPP or SQL database in the current prototype

Supabase is listed as a dependency but is not used by the current backend implementation.

### Offline and installation

- Service Worker
- Cached application assets
- Offline fallback
- Saved word copy
- Installable PWA manifest

### External and browser services

- Cloudinary API for audio uploads
- Device Nepali speech synthesis
- Browser notifications and vibration where supported

---

## 7. System Architecture

```text
Browser
  ├── Dictionary interface
  ├── Picture-card learning interface
  ├── Microphone and audio preview
  ├── localStorage cache
  └── Service Worker
           │
           ▼
Node.js HTTP server
  ├── Static frontend files
  ├── Word API
  ├── Contribution API
  ├── Reviewer API
  └── Audio upload API
           │
           ├── data/words.json
           └── Cloudinary audio storage
```

---

## 8. What Makes the Project Unique

### Community ownership

The platform does not only distribute vocabulary. It gives community members tools to contribute definitions, regional information and voices.

### Regional variants

A word can have multiple Doteli forms because the project supports regional and dialectal differences instead of enforcing one spelling or meaning.

### Verification status

Users can distinguish:

- Draft entries
- Community contributions
- Verified entries
- Community recordings awaiting review
- Verified recordings

### Voice-first preservation

The app records real human pronunciation, which is more culturally valuable than text alone.

### Learner-friendly design

Picture cards, XP, hearts and progress tracking make language learning active and engaging.

### Offline resilience

Caching and local storage allow users to continue viewing and learning with limited or interrupted connectivity.

### Lightweight and accessible

The prototype uses standard web technologies and can run on ordinary mobile phones or browsers without specialized software.

---

## 9. Social Impact

### Cultural preservation

Sabda Ghar helps record Doteli vocabulary before local expressions disappear or become limited to a few elders.

### Intergenerational connection

Children and young people can learn directly from family language and community recordings.

### Community representation

Users can enter the districts where their words are spoken, preserving regional identity and variation.

### Education

Teachers and students gain a locally relevant digital resource for language learning and vocabulary practice.

### Digital inclusion

An installable, mobile-friendly website can be reached by users without a separate app-store download.

### Community trust

Reviewer and verification features reduce misinformation and improve confidence in contributed content.

---

## 10. Future Development

### Short term

- Expand the word and picture-card collections
- Invite native speakers and language experts to verify entries
- Add bulk and CSV data import tools
- Improve regional search and district filters
- Add clearer moderation and user attribution
- Add admin analytics
- Improve audio compression and playback
- Translate interface labels into Nepali and Doteli

### Medium term

- Move data to a scalable database such as PostgreSQL or Supabase
- Add secure authentication and contributor accounts
- Build a moderator dashboard
- Add public contribution history
- Add sentence examples and contextual meanings
- Support pronunciation comparison
- Add downloadable lesson packs
- Add Android and iOS installation improvements

### Long term

- Preserve endangered and under-documented words
- Create a public Doteli language archive
- Provide open APIs for schools and researchers
- Train community-supported spelling and pronunciation models
- Include grammar, stories and cultural lessons
- Collaborate with schools, universities and cultural organizations
- Establish a local language-verification network

Future machine-learning features will require community consent and must remain secondary to community control over language data.

---

## 11. Team

> Replace these placeholders with the real names and roles before presentation.

| Team Member | Responsibility |
|---|---|
| **[Name]** | Project lead and overall coordination |
| **[Name]** | Frontend design and interface development |
| **[Name]** | Backend and API development |
| **[Name]** | Doteli language research and content review |
| **[Name]** | Audio recording, testing and quality assurance |
| **[Name]** | Documentation and presentation |

---

## 12. Closing

Sabda Ghar is more than a digital dictionary. It is a shared space for memory, identity and language continuity.

Its main goal is simple:

**Do not let a spoken word disappear just because it has no permanent place on the internet.**

By combining accessible technology, community participation and careful verification, Sabda Ghar can help the Doteli-speaking community preserve its vocabulary, teach the next generation and share its linguistic identity with the wider world.

---

**Sabda Ghar — Every word has a home.**

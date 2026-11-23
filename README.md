# Sabda Ghar

### Every word has a home

**Sabda Ghar** is a community-powered English, Nepali, and Doteli dictionary built to preserve and teach the language of Nepal's Sudurpashchim Province.

Users can search words, hear Nepali pronunciations, listen to community-recorded Doteli voice samples, add regional forms, learn with picture cards, and help trusted reviewers verify contributions.

**Live local demonstration:** [http://127.0.0.1:4173](http://127.0.0.1:4173)

---

## Features

- Search in English, Nepali, Roman Nepali, or Doteli
- Normalized Devanagari search for common spelling variants
- English, Nepali, Roman Nepali, Doteli, region, contributor, and verification views
- Filter to show words that do not yet have a Doteli form
- Browser-based Nepali text-to-speech
- Community Doteli text contributions
- Live microphone recording and audio-file upload
- Cloudinary-hosted voice recordings
- Reviewer controls for verifying or removing entries
- Duolingo-style picture lessons in Nepali or Doteli
- Two quiz formats: picture to word and word to picture
- Hearts, XP, streaks, lesson progression, and saved progress
- Installable Progressive Web App experience
- Offline app shell and saved word data
- Responsive, mobile-friendly interface
- Live dictionary statistics

---

## Problem

Doteli is spoken across Sudurpashchim, but its vocabulary and pronunciation remain difficult to find in accessible written and digital resources. Words are often passed between families and communities through speech rather than recorded in a searchable archive.

This creates several challenges:

- Few accessible Doteli dictionaries or learning tools
- Limited audio resources for pronunciation
- Regional vocabulary differences that are not represented consistently
- Risk of words becoming less familiar to younger generations
- Few simple ways for native speakers to contribute and verify language knowledge

The challenge is not translation alone. It is documenting, sharing, and preserving language knowledge while keeping the community involved.

---

## Our Inspiration

Sabda Ghar means **"House of Words."**

The project began with the belief that:

> Every word carries family memory, place, and identity.

It is inspired by community encyclopedias, audio-first cultural archives, visual language-learning apps, and Nepal's linguistic diversity. The goal is to give every contributor a place to preserve the words and expressions they know.

---

## Solution

Sabda Ghar combines a searchable dictionary, community voice archive, verification workflow, and visual learning system.

### 1. Discover words

Users can search across English, Nepali, Roman Nepali, and Doteli. The app also highlights words that are missing Doteli contributions.

### 2. Hear words

The app uses device Nepali speech synthesis for Nepali words and plays community-contributed Doteli recordings through an audio player.

### 3. Preserve local forms

Community members can add Doteli words together with their district or area and contributor name. Multiple forms can exist for the same English word.

### 4. Verify contributions

Reviewer mode allows trusted users to verify Doteli text, verify voice recordings, and remove inappropriate or incorrect entries.

### 5. Learn interactively

The Learn section provides picture cards and quizzes for Nepali and Doteli, with XP, hearts, streaks, and unlockable lessons.

---

## Live Demonstration

### Run locally

```bash
npm install
npm start
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173).

### Suggested demo flow

1. Open the home page and search for **water** or **पानी**.
2. Compare the English, Nepali, Roman Nepali, and Doteli forms.
3. Listen to the Nepali word or play an available Doteli recording.
4. Enable **Only words missing Doteli** to find contribution opportunities.
5. Add a Doteli form with a region and contributor name.
6. Open reviewer mode to verify text or voice samples.
7. Visit **Learn** and complete a picture-card lesson.
8. Show XP, hearts, streak, lesson progression, and saved progress.
9. Demonstrate PWA installation or reload with an unavailable network connection.

### Current prototype content

| Resource | Count |
|---|---:|
| Dictionary words | 48 |
| Doteli text entries | 45 |
| Entries with audio | 45 |
| Verified text entries | 0 |
| Picture cards | 63 |
| Learning lessons | 7 |

The verified count reflects the prototype's community-review stage. Community and verified status are intentionally kept separate.

---

## Language and Data

| Language or format | Purpose |
|---|---|
| English | Source words and wider accessibility |
| Nepali | National bridge language and pronunciation support |
| Roman Nepali | Accessible Romanized search |
| Doteli | Core language being documented |

The main word data is stored in `data/words.json`. Each word includes:

- Unique ID
- English word
- Nepali word
- Optional Roman Nepali spelling
- Doteli variants

Each Doteli variant can include text, region, contributor, verification status, source URL, and audio metadata.

Lesson content is stored in `data/cards.json`, including picture cards and lesson groups.

---

## Technology Stack

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript
- Browser Speech Synthesis API
- MediaRecorder and microphone APIs
- Responsive and mobile-first layouts

### Backend

- Node.js
- Built-in `http` server
- Custom REST-style API routes
- `dotenv` environment configuration

### Data and Storage

- JSON file storage in `data/words.json`
- Browser `localStorage` for progress, streaks, contributor names, and cached words
- Cloudinary for recorded and uploaded audio

### Offline and Installation

- Web App Manifest
- Service Worker
- Cached application assets
- Cached word data
- Installable PWA

---

## System Architecture

```text
Browser
  |- Dictionary interface
  |- Picture-card lessons
  |- Microphone recording and audio preview
  |- localStorage cache
  `- Service Worker
           |
           v
Node.js HTTP server
  |- Static frontend files
  |- Word and search API
  |- Community contribution API
  |- Reviewer API
  `- Audio upload API
           |
           |- data/words.json
           `- Cloudinary audio storage
```

---

## What's Unique

- **Community ownership:** Native speakers contribute language, place, and voice rather than consuming only externally prepared content.
- **Regional awareness:** The app welcomes multiple Doteli forms for the same concept.
- **Community and verified states:** Learners can distinguish drafts, community additions, and reviewed entries.
- **Voice preservation:** Text and pronunciation can be preserved together.
- **Offline resilience:** The app shell and saved dictionary remain available through the PWA cache.
- **Lightweight technology:** The prototype runs with no framework or SQL database, making the core app easy to understand and host.
- **Learning from living language:** Picture cards connect common ideas with Nepali and community-supplied Doteli forms.

---

## Social Impact and Future

Sabda Ghar can help:

- Preserve local vocabulary before it becomes inaccessible
- Give younger generations a practical introduction to Doteli
- Support intergenerational sharing between elders and learners
- Record regional pronunciation and expressions
- Help teachers and community organizations build learning resources
- Make Sudurpashchim's linguistic heritage visible in digital spaces

### Future plans

- Add user accounts and secure authentication
- Add district-by-district language and dialect maps
- Introduce an official moderator and contributor reputation system
- Expand the vocabulary and picture-card library
- Add stronger search across Romanized Doteli and Nepali
- Add sentence examples and cultural context
- Provide downloadable or printable learning packs
- Support more audio formats and automatic accessibility improvements
- Add multilingual documentation
- Deploy to a public production domain
- Explore long-term community-hosted backup and archive options

---

## Team

| Team Member or Group | Responsibility |
|---|---|
| Aaryanchand | Application development and repository implementation |
| Native speakers and community reviewers | Doteli vocabulary, regional context, recordings, and verification |
| Project contributors | Research, testing, content, documentation, and feedback |

The project document currently contains reserved placeholders for a formal presentation team. Replace or expand these entries when all team member names and roles are confirmed.

---

## Configuration

Audio uploads require Cloudinary environment variables:

```dotenv
PORT=4173
ADMIN_KEY=your-private-reviewer-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Do not commit real credentials to the repository. The app intentionally rejects audio uploads when Cloudinary is not configured.

## Run and Test

Start the server:

```bash
npm start
```

The project uses a Node.js HTTP server and serves the static frontend directly.

---

## Closing

Sabda Ghar is more than a digital dictionary. It is a shared home for memory, identity, and language continuity.

By combining accessible technology, community participation, regional language forms, and thoughtful verification, the project can help Doteli speakers preserve their vocabulary and teach the next generation.

**Sabda Ghar - Every word has a home.**

const fs = require('fs');
const path = require('path');

const bPath = 'e:/Reac-Node-Immersive Project/SIFS/SIFS-Student-UI/SIFS_Student_Panel/src';

// 1. AdminRoutes.tsx
let adminRoutes = fs.readFileSync(path.join(bPath, 'routes/AdminRoutes.tsx'), 'utf8');
adminRoutes = adminRoutes.replace(/path="\/trainings"/g, 'path="/training"');
adminRoutes = adminRoutes.replace(/path="\/trainings\/:id"/g, 'path="/training/:id"');
fs.writeFileSync(path.join(bPath, 'routes/AdminRoutes.tsx'), adminRoutes, 'utf8');

// 2. Navbar.tsx
let navbar = fs.readFileSync(path.join(bPath, 'components/ui/Navbar.tsx'), 'utf8');
navbar = navbar.replace(/to: "\/trainings"/g, 'to: "/training"');
fs.writeFileSync(path.join(bPath, 'components/ui/Navbar.tsx'), navbar, 'utf8');

// 3. Training.tsx
let training = fs.readFileSync(path.join(bPath, 'pages/Training/Training.tsx'), 'utf8');
training = training.replace(/navigate\(`\/trainings\//g, 'navigate(`/training/');
training = training.replace(/navigate\("\/trainings"/g, 'navigate("/training"');
fs.writeFileSync(path.join(bPath, 'pages/Training/Training.tsx'), training, 'utf8');

// 4. ReadMore.tsx
let readMore = fs.readFileSync(path.join(bPath, 'pages/Training/TrainingReadMore/ReadMore.tsx'), 'utf8');
readMore = readMore.replace(/navigate\("\/trainings"/g, 'navigate("/training"');
readMore = readMore.replace(/navigate\(`\/trainings\//g, 'navigate(`/training/');
fs.writeFileSync(path.join(bPath, 'pages/Training/TrainingReadMore/ReadMore.tsx'), readMore, 'utf8');

// 5. BookmarksPage.tsx
let bookmarks = fs.readFileSync(path.join(bPath, 'pages/Training/TrainingReadMore/BookmarksPage.tsx'), 'utf8');
bookmarks = bookmarks.replace(/navigate\(`\/trainings\//g, 'navigate(`/training/');
fs.writeFileSync(path.join(bPath, 'pages/Training/TrainingReadMore/BookmarksPage.tsx'), bookmarks, 'utf8');

// 6. CompleteTrainingPage.tsx
let complete = fs.readFileSync(path.join(bPath, 'pages/Training/TrainingReadMore/CompleteTrainingPage.tsx'), 'utf8');
complete = complete.replace(/navigate\(`\/trainings\//g, 'navigate(`/training/');
fs.writeFileSync(path.join(bPath, 'pages/Training/TrainingReadMore/CompleteTrainingPage.tsx'), complete, 'utf8');

// 7. NotesPage.tsx
let notes = fs.readFileSync(path.join(bPath, 'pages/Training/TrainingReadMore/NotesPage.tsx'), 'utf8');
notes = notes.replace(/navigate\(`\/trainings\//g, 'navigate(`/training/');
fs.writeFileSync(path.join(bPath, 'pages/Training/TrainingReadMore/NotesPage.tsx'), notes, 'utf8');

console.log('Fixed all routing to /training');

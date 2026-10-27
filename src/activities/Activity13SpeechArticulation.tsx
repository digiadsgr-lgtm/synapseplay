import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { isSpeechGateInstant, playCalmTone, speakGreek, syllableForSpeech } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';
import { rotateOptionsForSession, selectSessionRounds } from '../utils/clinicalAdhdEngine';

interface SpeechRound {
  wordEl: string;
  spokenWordEl: string;
  syllables: string[];
  promptQuestionEl: string;
  targetEmoji: string;
  options: Array<{ id: string; emoji: string; labelEl: string; isCorrect: boolean }>;
}

const AGE_SPEECH_ROUNDS: Record<string, SpeechRound[]> = {
  '4-5': [
    {
      wordEl: 'Μπά-λα',
      spokenWordEl: 'μπάλα',
      syllables: ['μπά', 'λα'],
      promptQuestionEl: 'Χτύπα 2 παλαμάκια για τη λέξη «μπάλα» και βρες την μπάλα!',
      targetEmoji: '⚽',
      options: [
        { id: 'sp4-1', emoji: '⚽', labelEl: 'Μπάλα', isCorrect: true },
        { id: 'sp4-2', emoji: '🚂', labelEl: 'Τρένο', isCorrect: false },
        { id: 'sp4-3', emoji: '🍎', labelEl: 'Μήλο', isCorrect: false },
      ],
    },
    {
      wordEl: 'Γά-τα',
      spokenWordEl: 'γάτα',
      syllables: ['γά', 'τα'],
      promptQuestionEl: 'Χτύπα 2 παλαμάκια για τη λέξη «γάτα» και βρες τη γάτα!',
      targetEmoji: '🐱',
      options: [
        { id: 'sp4-4', emoji: '🐶', labelEl: 'Σκύλος', isCorrect: false },
        { id: 'sp4-5', emoji: '🐱', labelEl: 'Γάτα', isCorrect: true },
        { id: 'sp4-6', emoji: '🐸', labelEl: 'Βάτραχος', isCorrect: false },
      ],
    },
    {
      wordEl: 'Πα-πί',
      spokenWordEl: 'παπί',
      syllables: ['πα', 'πί'],
      promptQuestionEl: 'Χτύπα 2 παλαμάκια για τη λέξη «παπί» και βρες το παπί!',
      targetEmoji: '🦆',
      options: [
        { id: 'sp4-7', emoji: '🦆', labelEl: 'Παπί', isCorrect: true },
        { id: 'sp4-8', emoji: '🐮', labelEl: 'Αγελάδα', isCorrect: false },
        { id: 'sp4-9', emoji: '🐴', labelEl: 'Άλογο', isCorrect: false },
      ],
    },
    {
      wordEl: 'Κό-τα',
      spokenWordEl: 'κότα',
      syllables: ['κό', 'τα'],
      promptQuestionEl: 'Χτύπα 2 παλαμάκια για τη λέξη «κότα» και βρες την κότα!',
      targetEmoji: '🐔',
      options: [
        { id: 'sp4-10', emoji: '🐔', labelEl: 'Κότα', isCorrect: true },
        { id: 'sp4-11', emoji: '🐟', labelEl: 'Ψάρι', isCorrect: false },
        { id: 'sp4-12', emoji: '🐢', labelEl: 'Χελώνα', isCorrect: false },
      ],
    },
    {
      wordEl: 'Μή-λο',
      spokenWordEl: 'μήλο',
      syllables: ['μή', 'λο'],
      promptQuestionEl: 'Χτύπα 2 παλαμάκια για τη λέξη «μήλο» και βρες το κόκκινο μήλο!',
      targetEmoji: '🍎',
      options: [
        { id: 'sp4-13', emoji: '🍌', labelEl: 'Μπανάνα', isCorrect: false },
        { id: 'sp4-14', emoji: '🍎', labelEl: 'Μήλο', isCorrect: true },
        { id: 'sp4-15', emoji: '🍓', labelEl: 'Φράουλα', isCorrect: false },
      ],
    },
    {
      wordEl: 'Ψά-ρι',
      spokenWordEl: 'ψάρι',
      syllables: ['ψά', 'ρι'],
      promptQuestionEl: 'Χτύπα 2 παλαμάκια για τη λέξη «ψάρι» και βρες το ψαράκι!',
      targetEmoji: '🐟',
      options: [
        { id: 'sp4-16', emoji: '🐟', labelEl: 'Ψάρι', isCorrect: true },
        { id: 'sp4-17', emoji: '🦁', labelEl: 'Λιοντάρι', isCorrect: false },
        { id: 'sp4-18', emoji: '🐘', labelEl: 'Ελέφαντας', isCorrect: false },
      ],
    },
    {
      wordEl: 'Δέ-ντρο',
      spokenWordEl: 'δέντρο',
      syllables: ['δέ', 'ντρο'],
      promptQuestionEl: 'Χτύπα 2 παλαμάκια για τη λέξη «δέντρο» και βρες το πράσινο δέντρο!',
      targetEmoji: '🌳',
      options: [
        { id: 'sp4-19', emoji: '🌳', labelEl: 'Δέντρο', isCorrect: true },
        { id: 'sp4-20', emoji: '🌻', labelEl: 'Ηλίανθος', isCorrect: false },
        { id: 'sp4-21', emoji: '🍄', labelEl: 'Μανιτάρι', isCorrect: false },
      ],
    },
    {
      wordEl: 'Σπί-τι',
      spokenWordEl: 'σπίτι',
      syllables: ['σπί', 'τι'],
      promptQuestionEl: 'Χτύπα 2 παλαμάκια για τη λέξη «σπίτι» και βρες το σπιτάκι!',
      targetEmoji: '🏠',
      options: [
        { id: 'sp4-22', emoji: '⛺', labelEl: 'Σκηνή', isCorrect: false },
        { id: 'sp4-23', emoji: '🏠', labelEl: 'Σπίτι', isCorrect: true },
        { id: 'sp4-24', emoji: '🏰', labelEl: 'Κάστρο', isCorrect: false },
      ],
    },
    {
      wordEl: 'Βά-ζο',
      spokenWordEl: 'βάζο',
      syllables: ['βά', 'ζο'],
      promptQuestionEl: 'Χτύπα 2 παλαμάκια για τη λέξη «βάζο» και βρες το πήλινο βάζο!',
      targetEmoji: '🏺',
      options: [
        { id: 'sp4-25', emoji: '🏺', labelEl: 'Βάζο', isCorrect: true },
        { id: 'sp4-26', emoji: '🥄', labelEl: 'Κουτάλι', isCorrect: false },
        { id: 'sp4-27', emoji: '🪑', labelEl: 'Καρέκλα', isCorrect: false },
      ],
    },
    {
      wordEl: 'Φύλ-λο',
      spokenWordEl: 'φύλλο',
      syllables: ['φύλ', 'λο'],
      promptQuestionEl: 'Χτύπα 2 παλαμάκια για τη λέξη «φύλλο» και βρες το πράσινο φύλλο!',
      targetEmoji: '🍃',
      options: [
        { id: 'sp4-28', emoji: '☁️', labelEl: 'Σύννεφο', isCorrect: false },
        { id: 'sp4-29', emoji: '🍃', labelEl: 'Φύλλο', isCorrect: true },
        { id: 'sp4-30', emoji: '🌈', labelEl: 'Ουράνιο Τόξο', isCorrect: false },
      ],
    },
    {
      wordEl: 'Ρό-δα',
      spokenWordEl: 'ρόδα',
      syllables: ['ρό', 'δα'],
      promptQuestionEl: 'Χτύπα 2 παλαμάκια για τη λέξη «ρόδα» και βρες τη στρογγυλή ρόδα!',
      targetEmoji: '🛞',
      options: [
        { id: 'sp4-31', emoji: '🛞', labelEl: 'Ρόδα', isCorrect: true },
        { id: 'sp4-32', emoji: '⛵', labelEl: 'Καράβι', isCorrect: false },
        { id: 'sp4-33', emoji: '🚁', labelEl: 'Ελικόπτερο', isCorrect: false },
      ],
    },
    {
      wordEl: 'Κύ-μα',
      spokenWordEl: 'κύμα',
      syllables: ['κύ', 'μα'],
      promptQuestionEl: 'Χτύπα 2 παλαμάκια για τη λέξη «κύμα» και βρες το μπλε κύμα!',
      targetEmoji: '🌊',
      options: [
        { id: 'sp4-34', emoji: '⛰️', labelEl: 'Βουνό', isCorrect: false },
        { id: 'sp4-35', emoji: '🌊', labelEl: 'Κύμα', isCorrect: true },
        { id: 'sp4-36', emoji: '🌵', labelEl: 'Κάκτος', isCorrect: false },
      ],
    },
  ],
  '6-8': [
    {
      wordEl: 'Χε-λώ-να',
      spokenWordEl: 'χελώνα',
      syllables: ['χε', 'λώ', 'να'],
      promptQuestionEl: 'Χτύπα παλαμάκια καθώς τρέχουν οι 3 συλλαβές στη λέξη «χελώνα» και βρες τη σωστή περιγραφή της!',
      targetEmoji: '🐢',
      options: [
        { id: 'sp6-1', emoji: '🐢', labelEl: 'Χελώνα: Έχει σκληρό καβούκι', isCorrect: true },
        { id: 'sp6-2', emoji: '⛵', labelEl: 'Καράβι: Ταξιδεύει στη θάλασσα', isCorrect: false },
        { id: 'sp6-3', emoji: '🌻', labelEl: 'Ηλίανθος: Κίτρινο λουλούδι', isCorrect: false },
      ],
    },
    {
      wordEl: 'Κα-ρά-βι',
      spokenWordEl: 'καράβι',
      syllables: ['κα', 'ρά', 'βι'],
      promptQuestionEl: 'Χτύπα παλαμάκια καθώς τρέχουν οι 3 συλλαβές στη λέξη «καράβι» και βρες τη σωστή περιγραφή του!',
      targetEmoji: '⛵',
      options: [
        { id: 'sp6-4', emoji: '🌳', labelEl: 'Δέντρο: Έχει πράσινα φύλλα', isCorrect: false },
        { id: 'sp6-5', emoji: '⛵', labelEl: 'Καράβι: Ταξιδεύει πάνω στα κύματα', isCorrect: true },
        { id: 'sp6-6', emoji: '📘', labelEl: 'Βιβλίο: Έχει σελίδες που διαβάζουμε', isCorrect: false },
      ],
    },
    {
      wordEl: 'Θά-λασ-σα',
      spokenWordEl: 'θάλασσα',
      syllables: ['θά', 'λασ', 'σα'],
      promptQuestionEl: 'Χτύπα παλαμάκια καθώς τρέχουν οι 3 συλλαβές στη λέξη «θάλασσα» και βρες τη σωστή περιγραφή της!',
      targetEmoji: '🌊',
      options: [
        { id: 'sp6-7', emoji: '☀️', labelEl: 'Ήλιος: Λάμπει ψηλά στον ουρανό', isCorrect: false },
        { id: 'sp6-8', emoji: '🌊', labelEl: 'Θάλασσα: Αλμυρό νερό με κύματα', isCorrect: true },
        { id: 'sp6-9', emoji: '🏠', labelEl: 'Σπίτι: Έχει στέγη και παράθυρα', isCorrect: false },
      ],
    },
    {
      wordEl: 'Λε-μό-νι',
      spokenWordEl: 'λεμόνι',
      syllables: ['λε', 'μό', 'νι'],
      promptQuestionEl: 'Χτύπα παλαμάκια καθώς τρέχουν οι 3 συλλαβές στη λέξη «λεμόνι» και βρες τη σωστή περιγραφή του!',
      targetEmoji: '🍋',
      options: [
        { id: 'sp6-10', emoji: '🍋', labelEl: 'Λεμόνι: Κίτρινο ξινό φρούτο', isCorrect: true },
        { id: 'sp6-11', emoji: '🍎', labelEl: 'Μήλο: Κόκκινο γλυκό φρούτο', isCorrect: false },
        { id: 'sp6-12', emoji: '🚲', labelEl: 'Ποδήλατο: Έχει δύο ρόδες', isCorrect: false },
      ],
    },
    {
      wordEl: 'Τρε-νά-κι',
      spokenWordEl: 'τρενάκι',
      syllables: ['τρε', 'νά', 'κι'],
      promptQuestionEl: 'Χτύπα παλαμάκια καθώς τρέχουν οι 3 συλλαβές στη λέξη «τρενάκι» και βρες τη σωστή περιγραφή του!',
      targetEmoji: '🚂',
      options: [
        { id: 'sp6-13', emoji: '🚂', labelEl: 'Τρενάκι: Κινείται πάνω στις ράγες', isCorrect: true },
        { id: 'sp6-14', emoji: '⛵', labelEl: 'Καράβι: Πλέει στο νερό', isCorrect: false },
        { id: 'sp6-15', emoji: '🌙', labelEl: 'Φεγγάρι: Φωτίζει τη νύχτα', isCorrect: false },
      ],
    },
    {
      wordEl: 'Κι-θά-ρα',
      spokenWordEl: 'κιθάρα',
      syllables: ['κι', 'θά', 'ρα'],
      promptQuestionEl: 'Χτύπα παλαμάκια καθώς τρέχουν οι 3 συλλαβές στη λέξη «κιθάρα» και βρες τη σωστή περιγραφή της!',
      targetEmoji: '🎸',
      options: [
        { id: 'sp6-16', emoji: '🎸', labelEl: 'Κιθάρα: Μουσικό όργανο με χορδές', isCorrect: true },
        { id: 'sp6-17', emoji: '🔔', labelEl: 'Κουδούνι: Χτυπάει στην πόρτα', isCorrect: false },
        { id: 'sp6-18', emoji: '🏠', labelEl: 'Σπίτι: Χώρος που μένουμε', isCorrect: false },
      ],
    },
    {
      wordEl: 'Πυ-ξί-δα',
      spokenWordEl: 'πυξίδα',
      syllables: ['πυ', 'ξί', 'δα'],
      promptQuestionEl: 'Χτύπα παλαμάκια καθώς τρέχουν οι 3 συλλαβές στη λέξη «πυξίδα» και βρες τη σωστή περιγραφή της!',
      targetEmoji: '🧭',
      options: [
        { id: 'sp6-19', emoji: '🧭', labelEl: 'Πυξίδα: Δείχνει πάντα τον Βορρά', isCorrect: true },
        { id: 'sp6-20', emoji: '⛺', labelEl: 'Σκηνή: Κατασκήνωση στο δάσος', isCorrect: false },
        { id: 'sp6-21', emoji: '🔦', labelEl: 'Φακός: Φωτίζει στο σκοτάδι', isCorrect: false },
      ],
    },
    {
      wordEl: 'Στα-φύ-λι',
      spokenWordEl: 'σταφύλι',
      syllables: ['στα', 'φύ', 'λι'],
      promptQuestionEl: 'Χτύπα παλαμάκια καθώς τρέχουν οι 3 συλλαβές στη λέξη «σταφύλι» και βρες τη σωστή περιγραφή του!',
      targetEmoji: '🍇',
      options: [
        { id: 'sp6-22', emoji: '🍇', labelEl: 'Σταφύλι: Τσαμπί με γλυκές ρώγες', isCorrect: true },
        { id: 'sp6-23', emoji: '🍎', labelEl: 'Μήλο: Στρογγυλό κόκκινο φρούτο', isCorrect: false },
        { id: 'sp6-24', emoji: '🍌', labelEl: 'Μπανάνα: Μακρύ κίτρινο φρούτο', isCorrect: false },
      ],
    },
    {
      wordEl: 'Δελ-φί-νι',
      spokenWordEl: 'δελφίνι',
      syllables: ['δελ', 'φί', 'νι'],
      promptQuestionEl: 'Χτύπα παλαμάκια καθώς τρέχουν οι 3 συλλαβές στη λέξη «δελφίνι» και βρες τη σωστή περιγραφή του!',
      targetEmoji: '🐬',
      options: [
        { id: 'sp6-25', emoji: '🐬', labelEl: 'Δελφίνι: Έξυπνο πλάσμα της θάλασσας', isCorrect: true },
        { id: 'sp6-26', emoji: '🦅', labelEl: 'Αετός: Πετάει ψηλά στα βουνά', isCorrect: false },
        { id: 'sp6-27', emoji: '🦁', labelEl: 'Λιοντάρι: Ζει στη σαβάνα', isCorrect: false },
      ],
    },
    {
      wordEl: 'Φρά-ου-λα',
      spokenWordEl: 'φράουλα',
      syllables: ['φρά', 'ου', 'λα'],
      promptQuestionEl: 'Χτύπα παλαμάκια καθώς τρέχουν οι 3 συλλαβές στη λέξη «φράουλα» και βρες τη σωστή περιγραφή της!',
      targetEmoji: '🍓',
      options: [
        { id: 'sp6-28', emoji: '🍓', labelEl: 'Φράουλα: Κόκκινο αρωματικό φρούτο', isCorrect: true },
        { id: 'sp6-29', emoji: '🥦', labelEl: 'Μπρόκολο: Πράσινο λαχανικό', isCorrect: false },
        { id: 'sp6-30', emoji: '🥕', labelEl: 'Καρότο: Πορτοκαλί λαχανικό', isCorrect: false },
      ],
    },
    {
      wordEl: 'Κου-τά-λι',
      spokenWordEl: 'κουτάλι',
      syllables: ['κου', 'τά', 'λι'],
      promptQuestionEl: 'Χτύπα παλαμάκια καθώς τρέχουν οι 3 συλλαβές στη λέξη «κουτάλι» και βρες τη σωστή περιγραφή του!',
      targetEmoji: '🥄',
      options: [
        { id: 'sp6-31', emoji: '🥄', labelEl: 'Κουτάλι: Με αυτό τρώμε τη σούπα', isCorrect: true },
        { id: 'sp6-32', emoji: '🪑', labelEl: 'Καρέκλα: Έπιπλο για να καθόμαστε', isCorrect: false },
        { id: 'sp6-33', emoji: '🖍️', labelEl: 'Κηρομπογιά: Ζωγραφίζουμε στο χαρτί', isCorrect: false },
      ],
    },
    {
      wordEl: 'Πλα-νή-της',
      spokenWordEl: 'πλανήτης',
      syllables: ['πλα', 'νή', 'της'],
      promptQuestionEl: 'Χτύπα παλαμάκια καθώς τρέχουν οι 3 συλλαβές στη λέξη «πλανήτης» και βρες τη σωστή περιγραφή του!',
      targetEmoji: '🪐',
      options: [
        { id: 'sp6-34', emoji: '🪐', labelEl: 'Πλανήτης: Γυρίζει γύρω από τον Ήλιο', isCorrect: true },
        { id: 'sp6-35', emoji: '🌲', labelEl: 'Έλατο: Δέντρο του δάσους', isCorrect: false },
        { id: 'sp6-36', emoji: '🏠', labelEl: 'Σπίτι: Κτίριο στη γειτονιά', isCorrect: false },
      ],
    },
  ],
  '10-12': [
    {
      wordEl: 'Πο-δή-λα-το',
      spokenWordEl: 'ποδήλατο',
      syllables: ['πο', 'δή', 'λα', 'το'],
      promptQuestionEl: 'Χτύπα παλαμάκια καθώς τρέχουν οι 4 συλλαβές της σύνθετης λέξης «ποδήλατο» και βρες την ακριβή ετυμολογία και περιγραφή της:',
      targetEmoji: '🚲',
      options: [
        { id: 'sp10-1', emoji: '🚲', labelEl: 'Ποδήλατο: Πόδι + Ελαύνω (Δίτροχο όχημα με πετάλια)', isCorrect: true },
        { id: 'sp10-2', emoji: '🎒', labelEl: 'Σχολική Τσάντα: Μεταφορά τετραδίων', isCorrect: false },
        { id: 'sp10-3', emoji: '✏️', labelEl: 'Μολύβι: Όργανο γραφής και σχεδίου', isCorrect: false },
      ],
    },
    {
      wordEl: 'Α-στρο-ναύ-της',
      spokenWordEl: 'αστροναύτης',
      syllables: ['α', 'στρο', 'ναύ', 'της'],
      promptQuestionEl: 'Χτύπα παλαμάκια καθώς τρέχουν οι 4 συλλαβές της σύνθετης λέξης «αστροναύτης» και βρες από ποιες λέξεις προέρχεται:',
      targetEmoji: '🧑‍🚀',
      options: [
        { id: 'sp10-4', emoji: '⚓', labelEl: 'Αγκυροβόλιο: Σημείο που δένουν τα πλοία', isCorrect: false },
        { id: 'sp10-5', emoji: '🧑‍🚀', labelEl: 'Αστροναύτης: Άστρο + Ναύτης (Εξερευνητής του διαστήματος)', isCorrect: true },
        { id: 'sp10-6', emoji: '✈️', labelEl: 'Αεροπλάνο: Πτήση μέσα στην ατμόσφαιρα', isCorrect: false },
      ],
    },
    {
      wordEl: 'Συ-γκέ-ντρω-ση',
      spokenWordEl: 'συγκέντρωση',
      syllables: ['συ', 'γκέ', 'ντρω', 'ση'],
      promptQuestionEl: 'Χτύπα παλαμάκια καθώς τρέχουν οι 4 συλλαβές στη λέξη «συγκέντρωση» και βρες το ακριβές νόημά της:',
      targetEmoji: '🎯',
      options: [
        { id: 'sp10-7', emoji: '🎯', labelEl: 'Συγκέντρωση: Εστιάζω προσεκτικά στον στόχο μου', isCorrect: true },
        { id: 'sp10-8', emoji: '🏃', labelEl: 'Διάσπαση: Η προσοχή μου πετάει από το ένα στο άλλο', isCorrect: false },
        { id: 'sp10-9', emoji: '😴', labelEl: 'Υπνηλία: Αποκοιμιέμαι χωρίς προσοχή', isCorrect: false },
      ],
    },
    {
      wordEl: 'Θερ-μό-με-τρο',
      spokenWordEl: 'θερμόμετρο',
      syllables: ['θερ', 'μό', 'με', 'τρο'],
      promptQuestionEl: 'Χτύπα παλαμάκια καθώς τρέχουν οι 4 συλλαβές της σύνθετης λέξης «θερμόμετρο» και επίλεξε τη σημασία της:',
      targetEmoji: '🌡️',
      options: [
        { id: 'sp10-10', emoji: '🌡️', labelEl: 'Θερμόμετρο: Θερμός + Μέτρο (Όργανο μέτρησης θερμοκρασίας)', isCorrect: true },
        { id: 'sp10-11', emoji: '⏱️', labelEl: 'Χρονόμετρο: Χρόνος + Μέτρο (Όργανο μέτρησης χρόνου)', isCorrect: false },
        { id: 'sp10-12', emoji: '📏', labelEl: 'Χάρακας: Μέτρηση εκατοστών στο τετράδιο', isCorrect: false },
      ],
    },
    {
      wordEl: 'Βι-βλι-ο-θή-κη',
      spokenWordEl: 'βιβλιοθήκη',
      syllables: ['βι', 'βλι', 'ο', 'θή', 'κη'],
      promptQuestionEl: 'Χτύπα παλαμάκια καθώς τρέχουν οι 5 συλλαβές της σύνθετης λέξης «βιβλιοθήκη» και βρες από ποιες λέξεις προέρχεται:',
      targetEmoji: '📚',
      options: [
        { id: 'sp10-13', emoji: '📚', labelEl: 'Βιβλιοθήκη: Βιβλίο + Θήκη (Έπιπλο και χώρος φύλαξης βιβλίων)', isCorrect: true },
        { id: 'sp10-14', emoji: '✏️', labelEl: 'Μολυβοθήκη: Μολύβι + Θήκη (Κουτί για μολύβια)', isCorrect: false },
        { id: 'sp10-15', emoji: '🎒', labelEl: 'Σχολική Τσάντα: Μεταφορά σχολικών ειδών', isCorrect: false },
      ],
    },
    {
      wordEl: 'Αυ-τορ-ρύθ-μι-ση',
      spokenWordEl: 'αυτορρύθμιση',
      syllables: ['αυ', 'τορ', 'ρύθ', 'μι', 'ση'],
      promptQuestionEl: 'Χτύπα παλαμάκια καθώς τρέχουν οι 5 συλλαβές στη λέξη «αυτορρύθμιση» και επίλεξε τι σημαίνει στην πράξη:',
      targetEmoji: '🧭',
      options: [
        { id: 'sp10-16', emoji: '🧭', labelEl: 'Αυτορρύθμιση: Ελέγχω ήρεμα τις κινήσεις και τη σκέψη μου', isCorrect: true },
        { id: 'sp10-17', emoji: '🎲', labelEl: 'Παρορμητικότητα: Πατάω στην τύχη χωρίς σχέδιο', isCorrect: false },
        { id: 'sp10-18', emoji: '🛑', labelEl: 'Εγκατάλειψη: Σταματάω να προσπαθώ', isCorrect: false },
      ],
    },
    {
      wordEl: 'Η-λι-ό-λου-στος',
      spokenWordEl: 'ηλιόλουστος',
      syllables: ['η', 'λι', 'ό', 'λου', 'στος'],
      promptQuestionEl: 'Χτύπα παλαμάκια καθώς τρέχουν οι 5 συλλαβές της σύνθετης λέξης «ηλιόλουστος» και βρες τα δύο συνθετικά της:',
      targetEmoji: '☀️',
      options: [
        { id: 'sp10-19', emoji: '☀️', labelEl: 'Ηλιόλουστος: Ήλιος + Λούζω (Γεμάτος λαμπερό φως ηλίου)', isCorrect: true },
        { id: 'sp10-20', emoji: '🌧️', labelEl: 'Βροχερός: Σύννεφα και σταγόνες βροχής', isCorrect: false },
        { id: 'sp10-21', emoji: '🌙', labelEl: 'Φεγγαρόλουστος: Φωτισμένος από το φεγγάρι', isCorrect: false },
      ],
    },
    {
      wordEl: 'Πα-ρα-τη-ρη-τι-κός',
      spokenWordEl: 'παρατηρητικός',
      syllables: ['πα', 'ρα', 'τη', 'ρη', 'τι', 'κός'],
      promptQuestionEl: 'Χτύπα παλαμάκια καθώς τρέχουν οι 6 συλλαβές στη λέξη «παρατηρητικός» και επίλεξε τι σημαίνει:',
      targetEmoji: '🔍',
      options: [
        { id: 'sp10-22', emoji: '🔍', labelEl: 'Παρατηρητικός: Αυτός που προσέχει προσεκτικά τις λεπτομέρειες', isCorrect: true },
        { id: 'sp10-23', emoji: '🙈', labelEl: 'Απρόσεκτος: Αυτός που προσπερνά χωρίς να κοιτάζει', isCorrect: false },
        { id: 'sp10-24', emoji: '🏃', labelEl: 'Βιαστικός: Αυτός που τρέχει χωρίς έλεγχο', isCorrect: false },
      ],
    },
    {
      wordEl: 'Συ-νερ-γα-σί-α',
      spokenWordEl: 'συνεργασία',
      syllables: ['συ', 'νερ', 'γα', 'σί', 'α'],
      promptQuestionEl: 'Χτύπα παλαμάκια καθώς τρέχουν οι 5 συλλαβές στη λέξη «συνεργασία» και βρες από ποιες λέξεις αποτελείται:',
      targetEmoji: '🤝',
      options: [
        { id: 'sp10-25', emoji: '🤝', labelEl: 'Συνεργασία: Συν (Μαζί) + Έργο (Δουλεύουμε ομαδικά)', isCorrect: true },
        { id: 'sp10-26', emoji: '🧍', labelEl: 'Απομόνωση: Δουλεύω εντελώς μόνος', isCorrect: false },
        { id: 'sp10-27', emoji: '⏱️', labelEl: 'Καθυστέρηση: Αναβάλλω την εργασία', isCorrect: false },
      ],
    },
    {
      wordEl: 'Εν-συ-ναί-σθη-ση',
      spokenWordEl: 'ενσυναίσθηση',
      syllables: ['εν', 'συ', 'ναί', 'σθη', 'ση'],
      promptQuestionEl: 'Χτύπα παλαμάκια καθώς τρέχουν οι 5 συλλαβές στη λέξη «ενσυναίσθηση» και βρες την ακριβή της σημασία:',
      targetEmoji: '💛',
      options: [
        { id: 'sp10-28', emoji: '💛', labelEl: 'Ενσυναίσθηση: Καταλαβαίνω πώς νιώθει ο άλλος άνθρωπος', isCorrect: true },
        { id: 'sp10-29', emoji: '📢', labelEl: 'Ανταγωνισμός: Μιλάω πιο δυνατά από τους άλλους', isCorrect: false },
        { id: 'sp10-30', emoji: '🏆', labelEl: 'Εγωκεντρισμός: Κοιτάζω μόνο τη δική μου νίκη', isCorrect: false },
      ],
    },
    {
      wordEl: 'Τη-λε-σκό-πι-ο',
      spokenWordEl: 'τηλεσκόπιο',
      syllables: ['τη', 'λε', 'σκό', 'πι', 'ο'],
      promptQuestionEl: 'Χτύπα παλαμάκια καθώς τρέχουν οι 5 συλλαβές της λέξης «τηλεσκόπιο» και επίλεξε τη σημασία της:',
      targetEmoji: '🔭',
      options: [
        { id: 'sp10-31', emoji: '🔭', labelEl: 'Τηλεσκόπιο: Τηλε + Σκοπώ (Όργανο παρατήρησης των αστεριών)', isCorrect: true },
        { id: 'sp10-32', emoji: '🔬', labelEl: 'Μικροσκόπιο: Μικρός + Σκοπώ (Όργανο για μικροοργανισμούς)', isCorrect: false },
        { id: 'sp10-33', emoji: '⌚', labelEl: 'Ρολόι Χειρός: Μέτρηση της ώρας', isCorrect: false },
      ],
    },
    {
      wordEl: 'Με-θο-δι-κό-τη-τα',
      spokenWordEl: 'μεθοδικότητα',
      syllables: ['με', 'θο', 'δι', 'κό', 'τη', 'τα'],
      promptQuestionEl: 'Χτύπα παλαμάκια καθώς τρέχουν οι 6 συλλαβές στη λέξη «μεθοδικότητα» και βρες το νόημά της:',
      targetEmoji: '📋',
      options: [
        { id: 'sp10-34', emoji: '📋', labelEl: 'Μεθοδικότητα: Προχωρώ με οργανωμένα βήματα και σειρά', isCorrect: true },
        { id: 'sp10-35', emoji: '🌪️', labelEl: 'Ακαταστασία: Κάνω πολλά πράγματα ανακατεμένα', isCorrect: false },
        { id: 'sp10-36', emoji: '💤', labelEl: 'Αναβλητικότητα: Αφήνω τα πάντα για αύριο', isCorrect: false },
      ],
    },
  ],
};

/** «Ποδήλατο: Πόδι + Ελαύνω (…)» → «Πόδι + Ελαύνω (…)»: the option must not contain the answer word. */
export function definitionWithoutWord(labelEl: string): string {
  const stripped = labelEl.replace(/^[^:]+:\s*/, '');
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

type Step = 'listen' | 'clap' | 'meaning';

/**
 * «Το Μικρόφωνο των Συλλαβών» — syllable segmentation by clapping (audit 10/2026 rewrite).
 *
 * Before: a timer «clapped» by itself («Μπράβο! 2/2» with no child action), the picture choice
 * was trivial (the word was printed and spoken), and the older options started with the answer.
 *
 * Now:
 *  - 4-5 / 5-6 (guided): the syllables are visible; every 👏 lights the next one and says it.
 *  - 6-8: the child decides how many claps the word has, then presses «✓ Τελείωσα».
 *    Wrong count → the app claps it together with the child (syllables light up one by one).
 *  - 8-12: same counting, then «Τι σημαίνει;» with definitions that no longer contain the word.
 */
export const Activity13SpeechArticulation: React.FC<ActivityRunnerRenderProps> = ({
  phase,
  currentRound,
  totalRounds,
  hintLevel,
  ageBand,
  adaptiveProfile,
  sessionSeed = 0,
  advanceRound,
  triggerGentleFeedback,
}) => {
  const { settings } = useApp();
  const { runDebounced, getAbsorbedCount } = useDebouncedAction();

  const tierKey =
    ageBand === '4-5' || ageBand === '5-6'
      ? '4-5'
      : ageBand === '8-10' || ageBand === '10-12' || adaptiveProfile.enrichChallenge
      ? '10-12'
      : '6-8';
  const pool = AGE_SPEECH_ROUNDS[tierKey];
  const activeRounds = useMemo(
    () => selectSessionRounds(pool, totalRounds, sessionSeed),
    [pool, totalRounds, sessionSeed]
  );
  const round = activeRounds[(currentRound - 1) % activeRounds.length];
  const total = round.syllables.length;
  const isGuided = tierKey === '4-5' || hintLevel >= 1;
  const asksMeaning = tierKey === '10-12';
  const voice = settings.voiceEnabled;
  const rate = adaptiveProfile.speechRate;

  const [step, setStep] = useState<Step>('listen');
  const [claps, setClaps] = useState<number>(0);
  const [litIdx, setLitIdx] = useState<number | null>(null);
  const demoTokenRef = useRef<number>(0);

  /** Says the word syllable by syllable, lighting each box IN SYNC with the voice, then the whole word. */
  const playSyllableDemo = async (): Promise<void> => {
    const token = ++demoTokenRef.current;
    for (let i = 0; i < total; i++) {
      if (demoTokenRef.current !== token) return;
      setLitIdx(i);
      playCalmTone('clap', settings.soundEnabled);
      await speakGreek(syllableForSpeech(round.syllables[i]), voice, rate, { interrupt: i === 0, kind: 'syllable' });
      await new Promise((r) => window.setTimeout(r, 180));
    }
    if (demoTokenRef.current !== token) return;
    setLitIdx(null);
    await speakGreek(round.spokenWordEl, voice, rate, { interrupt: false, kind: 'syllable' });
  };

  useEffect(() => {
    demoTokenRef.current += 1;
    setClaps(0);
    setLitIdx(null);
    setStep('listen');
    let alive = true;
    const prompt = isGuided
      ? `${round.spokenWordEl}! Χτύπα ένα παλαμάκι για κάθε κομμάτι της λέξης.`
      : `${round.spokenWordEl}! Πόσα παλαμάκια έχει; Χτύπα τα και πάτα «Τελείωσα».`;
    const spoken = speakGreek(prompt, voice, rate);
    if (isSpeechGateInstant()) setStep('clap');
    else
      void spoken.then(() => {
        if (alive) setStep('clap');
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRound, sessionSeed, round.spokenWordEl, isGuided]);

  useEffect(() => {
    if (phase === 'PAUSED' || phase === 'COMPLETED') demoTokenRef.current += 1;
  }, [phase]);

  const finishClapping = async () => {
    await speakGreek(round.spokenWordEl, voice, rate, { protect: true, kind: 'syllable' });
    if (asksMeaning) {
      setStep('meaning');
      speakGreek(`Τι σημαίνει ${round.spokenWordEl};`, voice, rate);
    } else {
      advanceRound(getAbsorbedCount());
    }
  };

  const handleClap = () => {
    if (step === 'listen') setStep('clap'); // the child may start before the voice ends
    if (step === 'meaning') return;
    runDebounced(() => {
      playCalmTone('clap', settings.soundEnabled);
      if (isGuided) {
        const idx = Math.min(claps, total - 1);
        setLitIdx(idx);
        speakGreek(syllableForSpeech(round.syllables[idx]), voice, rate, { kind: 'syllable' });
        const next = claps + 1;
        setClaps(next);
        if (next >= total) {
          window.setTimeout(() => {
            setLitIdx(null);
            void finishClapping();
          }, 450);
        }
      } else {
        setClaps((c) => Math.min(c + 1, 9));
      }
    });
  };

  const handleDone = () => {
    runDebounced(() => {
      if (claps === total) {
        void playSyllableDemo().then(() => {
          if (asksMeaning) {
            setStep('meaning');
            speakGreek(`Τι σημαίνει ${round.spokenWordEl};`, voice, rate);
          } else {
            advanceRound(getAbsorbedCount());
          }
        });
        return;
      }
      setClaps(0);
      triggerGentleFeedback(
        claps < total ? 'Λίγα παλαμάκια. Ας τα χτυπήσουμε μαζί!' : 'Πολλά παλαμάκια. Ας τα χτυπήσουμε μαζί!'
      );
      window.setTimeout(() => void playSyllableDemo(), 1800);
    });
  };

  const meaningOptions = useMemo(
    () => rotateOptionsForSession(round.options, sessionSeed, currentRound),
    [round.options, sessionSeed, currentRound]
  );

  const handleMeaning = (isCorrect: boolean) => {
    runDebounced(() => {
      if (isCorrect) {
        advanceRound(getAbsorbedCount());
      } else {
        triggerGentleFeedback(`Όχι ακριβώς. Άκου ξανά τη λέξη «${round.spokenWordEl}» και σκέψου τι σημαίνει.`);
      }
    });
  };

  return (
    <div
      className="space-y-4 text-center"
      data-testid="activity-13-speech-articulation"
      data-step={step}
      data-syllables={total}
    >
      <div className="p-4 sm:p-5 rounded-3xl bg-sage-surface border-4 border-sage space-y-3">
        <div className="text-5xl" aria-hidden="true">{round.targetEmoji}</div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal" data-testid="speech-word">
            {isGuided ? round.wordEl : round.spokenWordEl}
          </h2>
          <button
            type="button"
            data-testid="speech-word-listen-btn"
            onClick={() => speakGreek(round.spokenWordEl, true, rate, { kind: 'syllable' })}
            className="px-3 py-1.5 rounded-xl bg-white border-2 border-sage text-sm font-extrabold text-charcoal hover:bg-sage hover:text-white"
          >
            🔊 Άκου
          </button>
        </div>

        {step !== 'meaning' && (
          <p className="text-base font-bold text-charcoal">
            {isGuided ? '👏 Ένα παλαμάκι για κάθε κομμάτι της λέξης' : '👏 Πόσα παλαμάκια έχει η λέξη;'}
          </p>
        )}

        {/* Syllable boxes: visible for guided play, after a correct count, or during «Δείξε μου» */}
        <div className="flex flex-wrap items-center justify-center gap-2.5" data-testid="speech-karaoke-syllable-track">
          {(isGuided || litIdx !== null || step === 'meaning'
            ? round.syllables
            : Array.from({ length: claps }, () => '👏')
          ).map((syl, idx) => {
            const isLit = litIdx === idx;
            const isDone = isGuided && idx < claps;
            return (
              <span
                key={`${syl}-${idx}`}
                data-testid={`syllable-box-${idx}`}
                data-karaoke-active={isLit ? 'true' : 'false'}
                className={`px-4 py-2.5 rounded-2xl border-4 font-extrabold text-xl transition-all ${
                  isLit
                    ? 'bg-ochre text-charcoal border-charcoal scale-110'
                    : isDone || step === 'meaning'
                    ? 'bg-sage-dark text-white border-charcoal'
                    : 'bg-white text-charcoal border-sand-dark'
                }`}
              >
                {syl}
              </span>
            );
          })}
        </div>

        {step !== 'meaning' && (
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              type="button"
              data-testid="speech-clap-syllable-btn"
              onClick={handleClap}
              className="touch-target min-w-[180px] px-6 py-4 rounded-3xl bg-slate text-white font-extrabold text-xl inline-flex items-center justify-center gap-2 hover:bg-slate-dark"
            >
              <span className="text-3xl" aria-hidden="true">👏</span>
              <span>Παλαμάκι{isGuided ? ` (${claps}/${total})` : ''}</span>
            </button>
            {!isGuided && (
              <button
                type="button"
                data-testid="speech-clap-done-btn"
                onClick={handleDone}
                disabled={claps === 0}
                className="touch-target px-6 py-4 rounded-3xl bg-sage-dark text-white font-extrabold text-xl disabled:opacity-50"
              >
                ✓ Τελείωσα ({claps})
              </button>
            )}
            <button
              type="button"
              data-testid="speech-auto-run-syllables-btn"
              onClick={() => {
                setClaps(0);
                void playSyllableDemo();
              }}
              className="touch-target px-4 py-3 rounded-2xl bg-white border-2 border-slate text-charcoal font-extrabold text-sm"
            >
              ▶️ Δείξε μου
            </button>
          </div>
        )}
      </div>

      {step === 'meaning' && (
        <div className="space-y-3" data-testid="speech-meaning-step">
          <p className="text-lg font-extrabold text-charcoal">Τι σημαίνει «{round.spokenWordEl}»;</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
            {meaningOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                data-testid={opt.isCorrect ? 'speech-articulation-target' : `speech-opt-${opt.id}`}
                onClick={() => handleMeaning(opt.isCorrect)}
                className={`touch-target min-h-[96px] p-4 rounded-3xl border-4 flex flex-col items-center justify-center gap-2 ${
                  hintLevel >= 2 && opt.isCorrect
                    ? 'bg-sage-surface border-sage-dark ring-4 ring-sage/40'
                    : 'bg-white border-sand-dark hover:border-slate'
                }`}
              >
                <span className="text-sm sm:text-base font-extrabold text-charcoal">{definitionWithoutWord(opt.labelEl)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

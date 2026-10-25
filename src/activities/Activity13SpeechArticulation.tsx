import React, { useState, useEffect, useMemo } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { playCalmTone, speakGreek, speakGreekSyllable } from '../utils/soundAndSpeech';
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
        { id: 'sp4-1', emoji: '⚽', labelEl: 'Μπάλα (2 συλλαβές)', isCorrect: true },
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
        { id: 'sp4-5', emoji: '🐱', labelEl: 'Γάτα (2 συλλαβές)', isCorrect: true },
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
        { id: 'sp4-7', emoji: '🦆', labelEl: 'Παπί (2 συλλαβές)', isCorrect: true },
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
        { id: 'sp4-10', emoji: '🐔', labelEl: 'Κότα (2 συλλαβές)', isCorrect: true },
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
        { id: 'sp4-14', emoji: '🍎', labelEl: 'Μήλο (2 συλλαβές)', isCorrect: true },
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
        { id: 'sp4-16', emoji: '🐟', labelEl: 'Ψάρι (2 συλλαβές)', isCorrect: true },
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
        { id: 'sp4-19', emoji: '🌳', labelEl: 'Δέντρο (2 συλλαβές)', isCorrect: true },
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
        { id: 'sp4-23', emoji: '🏠', labelEl: 'Σπίτι (2 συλλαβές)', isCorrect: true },
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
        { id: 'sp4-25', emoji: '🏺', labelEl: 'Βάζο (2 συλλαβές)', isCorrect: true },
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
        { id: 'sp4-29', emoji: '🍃', labelEl: 'Φύλλο (2 συλλαβές)', isCorrect: true },
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
        { id: 'sp4-31', emoji: '🛞', labelEl: 'Ρόδα (2 συλλαβές)', isCorrect: true },
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
        { id: 'sp4-35', emoji: '🌊', labelEl: 'Κύμα (2 συλλαβές)', isCorrect: true },
        { id: 'sp4-36', emoji: '🌵', labelEl: 'Κάκτος', isCorrect: false },
      ],
    },
  ],
  '6-8': [
    {
      wordEl: 'Χε-λώ-να',
      spokenWordEl: 'χελώνα',
      syllables: ['χε', 'λώ', 'να'],
      promptQuestionEl: 'Χτύπα τις 3 συλλαβές στη λέξη «χελώνα» και βρες ποια λέξη αρχίζει επίσης με την ίδια φωνούλα!',
      targetEmoji: '🐢',
      options: [
        { id: 'sp6-1', emoji: '🐙', labelEl: 'Χταπόδι (Αρχίζει με Χ)', isCorrect: true },
        { id: 'sp6-2', emoji: '⛵', labelEl: 'Καράβι (Αρχίζει με Κ)', isCorrect: false },
        { id: 'sp6-3', emoji: '🌻', labelEl: 'Ηλίανθος (Αρχίζει με Η)', isCorrect: false },
      ],
    },
    {
      wordEl: 'Κα-ρά-βι',
      spokenWordEl: 'καράβι',
      syllables: ['κα', 'ρά', 'βι'],
      promptQuestionEl: 'Χτύπα τις 3 συλλαβές στη λέξη «καράβι» και βρες τι ομοιοκαταληκτεί με το «καράβι»!',
      targetEmoji: '⛵',
      options: [
        { id: 'sp6-4', emoji: '🌳', labelEl: 'Δέντρο', isCorrect: false },
        { id: 'sp6-5', emoji: '🦌', labelEl: 'Ελάφι (Καράβι - Ελάφι)', isCorrect: true },
        { id: 'sp6-6', emoji: '📘', labelEl: 'Βιβλίο', isCorrect: false },
      ],
    },
    {
      wordEl: 'Θά-λα-σσα',
      spokenWordEl: 'θάλασσα',
      syllables: ['θά', 'λα', 'σσα'],
      promptQuestionEl: 'Πες καθαρά «θάλασσα» και βρες τη λέξη που έχει επίσης 3 συλλαβές!',
      targetEmoji: '🌊',
      options: [
        { id: 'sp6-7', emoji: '☀️', labelEl: 'Ήλιος (2 συλλαβές)', isCorrect: false },
        { id: 'sp6-8', emoji: '🐝', labelEl: 'Μέλισσα (3 συλλαβές)', isCorrect: true },
        { id: 'sp6-9', emoji: '🏠', labelEl: 'Σπίτι (2 συλλαβές)', isCorrect: false },
      ],
    },
    {
      wordEl: 'Λε-μό-νι',
      spokenWordEl: 'λεμόνι',
      syllables: ['λε', 'μό', 'νι'],
      promptQuestionEl: 'Χτύπα τις 3 συλλαβές στη λέξη «λεμόνι» και βρες τι ομοιοκαταληκτεί με το «λεμόνι»!',
      targetEmoji: '🍋',
      options: [
        { id: 'sp6-10', emoji: '🎈', labelEl: 'Μπαλόνι (Λεμόνι - Μπαλόνι)', isCorrect: true },
        { id: 'sp6-11', emoji: '🍎', labelEl: 'Μήλο', isCorrect: false },
        { id: 'sp6-12', emoji: '🚲', labelEl: 'Ποδήλατο', isCorrect: false },
      ],
    },
    {
      wordEl: 'Τρε-νά-κι',
      spokenWordEl: 'τρενάκι',
      syllables: ['τρε', 'νά', 'κι'],
      promptQuestionEl: 'Πες καθαρά το σύμπλεγμα στην αρχή της λέξης «τρενάκι» και βρες ποια λέξη αρχίζει επίσης με «τρ»!',
      targetEmoji: '🚂',
      options: [
        { id: 'sp6-13', emoji: '🍀', labelEl: 'Τριφύλλι (Αρχίζει με Τρ)', isCorrect: true },
        { id: 'sp6-14', emoji: '⛵', labelEl: 'Καράβι', isCorrect: false },
        { id: 'sp6-15', emoji: '🌙', labelEl: 'Φεγγάρι', isCorrect: false },
      ],
    },
    {
      wordEl: 'Κι-θά-ρα',
      spokenWordEl: 'κιθάρα',
      syllables: ['κι', 'θά', 'ρα'],
      promptQuestionEl: 'Χτύπα τις 3 συλλαβές στη λέξη «κιθάρα» και βρες το άλλο μουσικό όργανο με 3 συλλαβές!',
      targetEmoji: '🎸',
      options: [
        { id: 'sp6-16', emoji: '🥁', labelEl: 'Τύμπανο (3 συλλαβές)', isCorrect: true },
        { id: 'sp6-17', emoji: '🔔', labelEl: 'Κουδούνι', isCorrect: false },
        { id: 'sp6-18', emoji: '🏠', labelEl: 'Σπίτι (2 συλλαβές)', isCorrect: false },
      ],
    },
    {
      wordEl: 'Πυ-ξί-δα',
      spokenWordEl: 'πυξίδα',
      syllables: ['πυ', 'ξί', 'δα'],
      promptQuestionEl: 'Χτύπα τις 3 συλλαβές στη λέξη «πυξίδα» και βρες ποια λέξη αρχίζει επίσης με «π»!',
      targetEmoji: '🧭',
      options: [
        { id: 'sp6-19', emoji: '🚀', labelEl: 'Πύραυλος (Αρχίζει με Π)', isCorrect: true },
        { id: 'sp6-20', emoji: '⛺', labelEl: 'Σκηνή (Αρχίζει με Σ)', isCorrect: false },
        { id: 'sp6-21', emoji: '🔦', labelEl: 'Φακός (Αρχίζει με Φ)', isCorrect: false },
      ],
    },
    {
      wordEl: 'Στα-φύ-λι',
      spokenWordEl: 'σταφύλι',
      syllables: ['στα', 'φύ', 'λι'],
      promptQuestionEl: 'Πες καθαρά το σύμπλεγμα «στ» στη λέξη «σταφύλι» και βρες ποια λέξη έχει επίσης «στ»!',
      targetEmoji: '🍇',
      options: [
        { id: 'sp6-22', emoji: '⭐', labelEl: 'Αστέρι (Περιέχει «στ»)', isCorrect: true },
        { id: 'sp6-23', emoji: '🍎', labelEl: 'Μήλο', isCorrect: false },
        { id: 'sp6-24', emoji: '🍌', labelEl: 'Μπανάνα', isCorrect: false },
      ],
    },
    {
      wordEl: 'Δελ-φί-νι',
      spokenWordEl: 'δελφίνι',
      syllables: ['δελ', 'φί', 'νι'],
      promptQuestionEl: 'Χτύπα τις 3 συλλαβές στη λέξη «δελφίνι» και βρες τι ομοιοκαταληκτεί με το «δελφίνι»!',
      targetEmoji: '🐬',
      options: [
        { id: 'sp6-25', emoji: '🛴', labelEl: 'Πατίνι (Δελφίνι - Πατίνι)', isCorrect: true },
        { id: 'sp6-26', emoji: '🐳', labelEl: 'Φάλαινα', isCorrect: false },
        { id: 'sp6-27', emoji: '🦀', labelEl: 'Καβούρι', isCorrect: false },
      ],
    },
    {
      wordEl: 'Φρά-ου-λα',
      spokenWordEl: 'φράουλα',
      syllables: ['φρά', 'ου', 'λα'],
      promptQuestionEl: 'Πες καθαρά το σύμπλεγμα «φρ» στη λέξη «φράουλα» και βρες ποια λέξη έχει επίσης 3 συλλαβές!',
      targetEmoji: '🍓',
      options: [
        { id: 'sp6-28', emoji: '🍒', labelEl: 'Κεράσι (3 συλλαβές)', isCorrect: true },
        { id: 'sp6-29', emoji: '🍇', labelEl: 'Μούρο (2 συλλαβές)', isCorrect: false },
        { id: 'sp6-30', emoji: '🍏', labelEl: 'Μήλο (2 συλλαβές)', isCorrect: false },
      ],
    },
    {
      wordEl: 'Κου-τά-λι',
      spokenWordEl: 'κουτάλι',
      syllables: ['κου', 'τά', 'λι'],
      promptQuestionEl: 'Χτύπα τις 3 συλλαβές στη λέξη «κουτάλι» και βρες τι ομοιοκαταληκτεί με το «κουτάλι»!',
      targetEmoji: '🥄',
      options: [
        { id: 'sp6-31', emoji: '🍊', labelEl: 'Πορτοκάλι (Κουτάλι - Πορτοκάλι)', isCorrect: true },
        { id: 'sp6-32', emoji: '🍽️', labelEl: 'Πιάτο', isCorrect: false },
        { id: 'sp6-33', emoji: '🥛', labelEl: 'Ποτήρι', isCorrect: false },
      ],
    },
    {
      wordEl: 'Πλα-νή-της',
      spokenWordEl: 'πλανήτης',
      syllables: ['πλα', 'νή', 'της'],
      promptQuestionEl: 'Πες καθαρά το σύμπλεγμα «πλ» στη λέξη «πλανήτης» και βρες ποια λέξη αρχίζει επίσης με «πλ»!',
      targetEmoji: '🪐',
      options: [
        { id: 'sp6-34', emoji: '🚢', labelEl: 'Πλοίο (Αρχίζει με Πλ)', isCorrect: true },
        { id: 'sp6-35', emoji: '🌙', labelEl: 'Φεγγάρι', isCorrect: false },
        { id: 'sp6-36', emoji: '☀️', labelEl: 'Ήλιος', isCorrect: false },
      ],
    },
  ],
  '10-12': [
    {
      wordEl: 'Πο-δή-λα-το',
      spokenWordEl: 'ποδήλατο',
      syllables: ['πο', 'δή', 'λα', 'το'],
      promptQuestionEl: 'Κατάτμησε τις 4 συλλαβές στη λέξη «ποδήλατο» και επίλεξε την πολυσύλλαβη σύνθετη λέξη (4 συλλαβές):',
      targetEmoji: '🚲',
      options: [
        { id: 'sp10-1', emoji: '🧑‍🚀', labelEl: 'Αστροναύτης (4 συλλαβές)', isCorrect: true },
        { id: 'sp10-2', emoji: '🎒', labelEl: 'Τσάντα (2 συλλαβές)', isCorrect: false },
        { id: 'sp10-3', emoji: '✏️', labelEl: 'Μολύβι (3 συλλαβές)', isCorrect: false },
      ],
    },
    {
      wordEl: 'Ε-λέ-φα-ντας',
      spokenWordEl: 'ελέφαντας',
      syllables: ['ε', 'λέ', 'φα', 'ντας'],
      promptQuestionEl: 'Ένωσε τις συλλαβές και βρες το ακριβές συνώνυμο της λέξης «ήρεμος»:',
      targetEmoji: '🐘',
      options: [
        { id: 'sp10-4', emoji: '⚡', labelEl: 'Βιαστικός', isCorrect: false },
        { id: 'sp10-5', emoji: '🌿', labelEl: 'Γαλήνιος (Συνώνυμο)', isCorrect: true },
        { id: 'sp10-6', emoji: '🔊', labelEl: 'Θορυβώδης', isCorrect: false },
      ],
    },
    {
      wordEl: 'Συ-γκέ-ντρω-ση',
      spokenWordEl: 'συγκέντρωση',
      syllables: ['συ', 'γκέ', 'ντρω', 'ση'],
      promptQuestionEl: 'Πες καθαρά τη λέξη «συγκέντρωση» και βρες το συγγενικό ρήμα:',
      targetEmoji: '🎯',
      options: [
        { id: 'sp10-7', emoji: '🎯', labelEl: 'Εστιάζω και Συγκεντρώνομαι', isCorrect: true },
        { id: 'sp10-8', emoji: '🏃', labelEl: 'Απομακρύνομαι', isCorrect: false },
        { id: 'sp10-9', emoji: '😴', labelEl: 'Αποκοιμιέμαι', isCorrect: false },
      ],
    },
    {
      wordEl: 'Πε-τα-λού-δα',
      spokenWordEl: 'πεταλούδα',
      syllables: ['πε', 'τα', 'λού', 'δα'],
      promptQuestionEl: 'Κατάτμησε τις 4 συλλαβές και βρες το αντίθετο της λέξης «βιασύνη»:',
      targetEmoji: '🦋',
      options: [
        { id: 'sp10-10', emoji: '🧘', labelEl: 'Υπομονή και Ψυχραιμία', isCorrect: true },
        { id: 'sp10-11', emoji: '🌪️', labelEl: 'Αναστάτωση', isCorrect: false },
        { id: 'sp10-12', emoji: '🏎️', labelEl: 'Ταχύτητα', isCorrect: false },
      ],
    },
    {
      wordEl: 'Βι-βλι-ο-θή-κη',
      spokenWordEl: 'βιβλιοθήκη',
      syllables: ['βι', 'βλι', 'ο', 'θή', 'κη'],
      promptQuestionEl: 'Ένωσε τις 5 συλλαβές της σύνθετης λέξης «βιβλιοθήκη» και βρες από ποιες λέξεις προέρχεται:',
      targetEmoji: '📚',
      options: [
        { id: 'sp10-13', emoji: '📖', labelEl: 'Βιβλίο + Θήκη', isCorrect: true },
        { id: 'sp10-14', emoji: '✏️', labelEl: 'Μολύβι + Χαρτί', isCorrect: false },
        { id: 'sp10-15', emoji: '🎒', labelEl: 'Σχολείο + Τσάντα', isCorrect: false },
      ],
    },
    {
      wordEl: 'Αυ-το-ρρύ-θμι-ση',
      spokenWordEl: 'αυτορρύθμιση',
      syllables: ['αυ', 'το', 'ρρύ', 'θμι', 'ση'],
      promptQuestionEl: 'Πες καθαρά τη λέξη «αυτορρύθμιση» και επίλεξε τι σημαίνει στην πράξη:',
      targetEmoji: '🧭',
      options: [
        { id: 'sp10-16', emoji: '🧭', labelEl: 'Κυβερνώ ήρεμα τις κινήσεις και τη σκέψη μου', isCorrect: true },
        { id: 'sp10-17', emoji: '🎲', labelEl: 'Πατάω στην τύχη χωρίς να κοιτάζω', isCorrect: false },
        { id: 'sp10-18', emoji: '🛑', labelEl: 'Σταματάω να προσπαθώ', isCorrect: false },
      ],
    },
    {
      wordEl: 'Η-λι-ό-λου-στος',
      spokenWordEl: 'ηλιόλουστος',
      syllables: ['η', 'λι', 'ό', 'λου', 'στος'],
      promptQuestionEl: 'Ένωσε τις 5 συλλαβές της σύνθετης λέξης «ηλιόλουστος» και βρες τα δύο συνθετικά της:',
      targetEmoji: '☀️',
      options: [
        { id: 'sp10-19', emoji: '☀️', labelEl: 'Ήλιος + Λούζω', isCorrect: true },
        { id: 'sp10-20', emoji: '🌧️', labelEl: 'Βροχή + Σύννεφο', isCorrect: false },
        { id: 'sp10-21', emoji: '🌙', labelEl: 'Νύχτα + Αστέρι', isCorrect: false },
      ],
    },
    {
      wordEl: 'Πα-ρα-τη-ρη-τι-κός',
      spokenWordEl: 'παρατηρητικός',
      syllables: ['πα', 'ρα', 'τη', 'ρη', 'τι', 'κός'],
      promptQuestionEl: 'Κατάτμησε τη λέξη «παρατηρητικός» και επίλεξε τι σημαίνει:',
      targetEmoji: '🔍',
      options: [
        { id: 'sp10-22', emoji: '🔍', labelEl: 'Αυτός που προσέχει προσεκτικά τις λεπτομέρειες', isCorrect: true },
        { id: 'sp10-23', emoji: '🙈', labelEl: 'Αυτός που κλείνει τα μάτια', isCorrect: false },
        { id: 'sp10-24', emoji: '🏃', labelEl: 'Αυτός που τρέχει βιαστικά', isCorrect: false },
      ],
    },
    {
      wordEl: 'Συ-νερ-γα-σί-α',
      spokenWordEl: 'συνεργασία',
      syllables: ['συ', 'νερ', 'γα', 'σί', 'α'],
      promptQuestionEl: 'Πες καθαρά τη λέξη «συνεργασία» και βρες από ποιες λέξεις αποτελείται:',
      targetEmoji: '🤝',
      options: [
        { id: 'sp10-25', emoji: '🤝', labelEl: 'Συν (Μαζί) + Έργο', isCorrect: true },
        { id: 'sp10-26', emoji: '🧍', labelEl: 'Μόνος + Παιχνίδι', isCorrect: false },
        { id: 'sp10-27', emoji: '⏱️', labelEl: 'Ώρα + Σχολείο', isCorrect: false },
      ],
    },
    {
      wordEl: 'Εν-συν-αί-σθη-ση',
      spokenWordEl: 'ενσυναίσθηση',
      syllables: ['εν', 'συν', 'αί', 'σθη', 'ση'],
      promptQuestionEl: 'Κατάτμησε τη λέξη «ενσυναίσθηση» και βρες την ακριβή της σημασία:',
      targetEmoji: '💛',
      options: [
        { id: 'sp10-28', emoji: '💛', labelEl: 'Καταλαβαίνω πώς νιώθει ο άλλος άνθρωπος', isCorrect: true },
        { id: 'sp10-29', emoji: '📢', labelEl: 'Μιλάω πιο δυνατά από τους άλλους', isCorrect: false },
        { id: 'sp10-30', emoji: '🏆', labelEl: 'Κερδίζω πάντα πρώτος στο παιχνίδι', isCorrect: false },
      ],
    },
    {
      wordEl: 'Τη-λε-σκό-πι-ο',
      spokenWordEl: 'τηλεσκόπιο',
      syllables: ['τη', 'λε', 'σκό', 'πι', 'ο'],
      promptQuestionEl: 'Ένωσε τις 5 συλλαβές της λέξης «τηλεσκόπιο» και επίλεξε τη σημασία της:',
      targetEmoji: '🔭',
      options: [
        { id: 'sp10-31', emoji: '🔭', labelEl: 'Όργανο που βλέπει πολύ μακριά στα αστέρια', isCorrect: true },
        { id: 'sp10-32', emoji: '🎧', labelEl: 'Ακουστικά για μουσική', isCorrect: false },
        { id: 'sp10-33', emoji: '⌚', labelEl: 'Ρολόι χειρός', isCorrect: false },
      ],
    },
    {
      wordEl: 'Με-θο-δι-κό-τη-τα',
      spokenWordEl: 'μεθοδικότητα',
      syllables: ['με', 'θο', 'δι', 'κό', 'τη', 'τα'],
      promptQuestionEl: 'Κατάτμησε τις 6 συλλαβές στη λέξη «μεθοδικότητα» και βρες το νόημά της:',
      targetEmoji: '📋',
      options: [
        { id: 'sp10-34', emoji: '📋', labelEl: 'Προχωρώ με οργανωμένα βήματα και σειρά', isCorrect: true },
        { id: 'sp10-35', emoji: '🌪️', labelEl: 'Κάνω πολλά πράγματα ανακατεμένα', isCorrect: false },
        { id: 'sp10-36', emoji: '💤', labelEl: 'Αφήνω τα πάντα για αύριο', isCorrect: false },
      ],
    },
  ],
};

export const Activity13SpeechArticulation: React.FC<ActivityRunnerRenderProps> = ({
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

  // Age 8-10 and 10-12 both receive the 4-to-6 syllable phonological & semantic challenge pool
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

  const [clappedCount, setClappedCount] = useState<number>(0);
  const [activeKaraokeIdx, setActiveKaraokeIdx] = useState<number | null>(null);
  const [karaokeRunId, setKaraokeRunId] = useState<number>(0);
  const [speakSyllablesDuringRun, setSpeakSyllablesDuringRun] = useState<boolean>(false);

  useEffect(() => {
    setClappedCount(hintLevel === 2 ? round.syllables.length : 0);
    setActiveKaraokeIdx(null);
    setSpeakSyllablesDuringRun(false);
    speakGreek(round.promptQuestionEl, settings.voiceEnabled, adaptiveProfile.speechRate);
  }, [
    currentRound,
    hintLevel,
    round.syllables.length,
    round.promptQuestionEl,
    sessionSeed,
    settings.voiceEnabled,
    adaptiveProfile.speechRate,
  ]);

  // Automatic Karaoke Syllable Runner: steps through each syllable in rhythm so the child can clap their hands live!
  useEffect(() => {
    if (hintLevel === 2) {
      setActiveKaraokeIdx(null);
      return;
    }

    const total = round.syllables.length;
    const initialDelayMs = speakSyllablesDuringRun ? 180 : 750;
    const stepIntervalMs = 650;
    const timers: number[] = [];

    for (let i = 0; i < total; i++) {
      const t = window.setTimeout(() => {
        setActiveKaraokeIdx(i);
        setClappedCount((prev) => Math.max(prev, i + 1));
        playCalmTone('pulse', settings.soundEnabled);
        if (speakSyllablesDuringRun) {
          speakGreekSyllable(round.syllables[i], settings.voiceEnabled, adaptiveProfile.speechRate);
        }
      }, initialDelayMs + i * stepIntervalMs);
      timers.push(t);
    }

    const endTimer = window.setTimeout(() => {
      setActiveKaraokeIdx(null);
      if (speakSyllablesDuringRun) {
        speakGreek(round.spokenWordEl, settings.voiceEnabled, adaptiveProfile.speechRate);
      }
    }, initialDelayMs + total * stepIntervalMs + 250);
    timers.push(endTimer);

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [
    currentRound,
    hintLevel,
    karaokeRunId,
    speakSyllablesDuringRun,
    round.syllables,
    round.spokenWordEl,
    sessionSeed,
    settings.soundEnabled,
    settings.voiceEnabled,
    adaptiveProfile.speechRate,
  ]);

  const allClapped = clappedCount >= round.syllables.length;

  const handleClapSyllable = () => {
    runDebounced(() => {
      if (clappedCount < round.syllables.length) {
        const syl = round.syllables[clappedCount];
        setActiveKaraokeIdx(clappedCount);
        playCalmTone('pulse', settings.soundEnabled);
        // Uses dedicated syllable phonetic synthesis so single syllables are NEVER spelled out as letters
        speakGreekSyllable(syl, settings.voiceEnabled, adaptiveProfile.speechRate);
        setClappedCount((c) => {
          const next = c + 1;
          if (next === round.syllables.length) {
            window.setTimeout(() => {
              setActiveKaraokeIdx(null);
              speakGreek(round.spokenWordEl, settings.voiceEnabled, adaptiveProfile.speechRate);
            }, 380);
          }
          return next;
        });
      }
    });
  };

  const handleRestartKaraokeRun = () => {
    setClappedCount(0);
    setActiveKaraokeIdx(null);
    setSpeakSyllablesDuringRun(true);
    setKaraokeRunId((r) => r + 1);
  };

  const visibleOptions = useMemo(() => {
    const baseOpts =
      hintLevel === 2 || ageBand === '4-5' || adaptiveProfile.distractorReductionRatio >= 0.5
        ? round.options.filter((o, i) => o.isCorrect || i === 0)
        : round.options;
    return rotateOptionsForSession(baseOpts, sessionSeed, currentRound);
  }, [round.options, hintLevel, ageBand, adaptiveProfile.distractorReductionRatio, sessionSeed, currentRound]);

  const handleSelectOption = (isCorrect: boolean, labelEl: string) => {
    runDebounced(() => {
      if (isCorrect) {
        // Even if the child clapped physically in the room instead of pressing the syllable button,
        // celebrate and advance immediately!
        setClappedCount(round.syllables.length);
        setActiveKaraokeIdx(null);
        speakGreek(round.spokenWordEl, settings.voiceEnabled, adaptiveProfile.speechRate);
        advanceRound(getAbsorbedCount());
      } else {
        triggerGentleFeedback(
          `Άκου ξανά καθαρά: ψάχνουμε το φωνολογικό ταίρι για τη λέξη «${round.spokenWordEl}», όχι «${labelEl}».`
        );
      }
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 text-center" data-testid="activity-13-speech-articulation">
      {/* Syllabic Rhythm & Articulation Stage */}
      <div className="p-4 sm:p-6 rounded-3xl bg-sage-surface border-4 border-sage space-y-3 sm:space-y-4">
        <div className="text-4xl sm:text-5xl" aria-hidden="true">{round.targetEmoji}</div>
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          <h2 className="text-xl sm:text-2xl font-extrabold text-charcoal">{round.wordEl}</h2>
          <button
            type="button"
            data-testid="speech-word-listen-btn"
            onClick={() => speakGreek(round.spokenWordEl, true, adaptiveProfile.speechRate)}
            className="px-3 py-1.5 rounded-xl bg-white border-2 border-sage text-xs font-extrabold text-charcoal hover:bg-sage hover:text-white"
          >
            🔊 Άκου τη λέξη «{round.spokenWordEl}»
          </button>
        </div>
        <p className="text-sm sm:text-base font-bold text-charcoal">{round.promptQuestionEl}</p>

        {/* Interactive Karaoke Syllable Runner Boxes (auto-runs in rhythm AND each box is directly clickable!) */}
        <div
          className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 pt-1"
          data-testid="speech-karaoke-syllable-track"
        >
          {round.syllables.map((syl, idx) => {
            const isClapped = idx < clappedCount;
            const isCurrentlyRunning = activeKaraokeIdx === idx;
            return (
              <button
                key={`${syl}-${idx}`}
                type="button"
                data-testid={`syllable-box-${idx}`}
                data-karaoke-active={isCurrentlyRunning ? 'true' : 'false'}
                onClick={() => {
                  setActiveKaraokeIdx(idx);
                  speakGreekSyllable(syl, true, adaptiveProfile.speechRate);
                  setClappedCount((c) => Math.max(c, idx + 1));
                }}
                className={`relative px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl border-3 font-extrabold text-lg sm:text-xl transition-all cursor-pointer ${
                  isCurrentlyRunning
                    ? 'bg-ochre text-charcoal border-charcoal scale-110 ring-4 ring-ochre/40'
                    : isClapped
                    ? 'bg-sage-dark text-white border-charcoal scale-105'
                    : 'bg-white text-charcoal border-sand-dark hover:border-sage'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span>{syl}</span>
                  {(isCurrentlyRunning || isClapped) && (
                    <span className="text-base" aria-hidden="true">👏</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="pt-1 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            data-testid="speech-clap-syllable-btn"
            disabled={allClapped}
            onClick={handleClapSyllable}
            className="touch-target px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl bg-slate text-white font-extrabold text-base sm:text-lg inline-flex items-center gap-2 hover:bg-slate-dark disabled:opacity-60"
          >
            <span aria-hidden="true">👏</span>
            <span>
              {allClapped
                ? `Μπράβο! (${round.syllables.length}/${round.syllables.length} Συλλαβές)`
                : `Χτύπα Συλλαβή (${clappedCount}/${round.syllables.length})`}
            </span>
          </button>

          <button
            type="button"
            data-testid="speech-auto-run-syllables-btn"
            onClick={handleRestartKaraokeRun}
            className="touch-target px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-white border-2 border-slate text-charcoal font-extrabold text-xs sm:text-sm inline-flex items-center gap-1.5 hover:bg-sand-surface"
          >
            <span aria-hidden="true">▶️</span>
            <span>Τρέξε τις Συλλαβές με Ρυθμό</span>
          </button>
        </div>
      </div>

      {/* Phonological Target Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto">
        {visibleOptions.map((opt) => {
          const highlight = (hintLevel >= 1 || adaptiveProfile.autoHintBoost) && opt.isCorrect;
          return (
            <button
              key={opt.id}
              type="button"
              data-testid={opt.isCorrect ? 'speech-articulation-target' : `speech-opt-${opt.id}`}
              onClick={() => handleSelectOption(opt.isCorrect, opt.labelEl)}
              className={`touch-target min-h-[96px] sm:min-h-[116px] p-4 sm:p-5 rounded-3xl border-4 flex flex-col items-center justify-center gap-1.5 sm:gap-2 ${
                highlight
                  ? 'bg-sage-surface border-sage-dark ring-4 ring-sage/40'
                  : 'bg-white border-sand-dark hover:border-slate'
              }`}
            >
              <span className="text-4xl sm:text-5xl" aria-hidden="true">{opt.emoji}</span>
              <span className="text-sm sm:text-base font-extrabold text-charcoal">{opt.labelEl}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

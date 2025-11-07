import express from 'express';
import { Question } from 'exampro-shared';
import {
  CIVIL_LAW_QUESTIONS,
  CRIMINAL_LAW_QUESTIONS,
  LABOR_LAW_QUESTIONS,
  TAXATION_LAW_QUESTIONS,
  COMMERCIAL_LAW_QUESTIONS,
  REMEDIAL_LAW_QUESTIONS,
  LEGAL_ETHICS_QUESTIONS,
  POLITICAL_LAW_QUESTIONS
} from '../data/index.js';

const router = express.Router();

// Store questions in memory (in production, this would be a database)
let questions: Question[] = [
  ...CIVIL_LAW_QUESTIONS,
  ...CRIMINAL_LAW_QUESTIONS,
  ...LABOR_LAW_QUESTIONS,
  ...TAXATION_LAW_QUESTIONS,
  ...COMMERCIAL_LAW_QUESTIONS,
  ...REMEDIAL_LAW_QUESTIONS,
  ...LEGAL_ETHICS_QUESTIONS,
  ...POLITICAL_LAW_QUESTIONS
];

/**
 * Get all available subjects
 */
router.get('/subjects', (req, res) => {
  try {
    const subjects = new Set(questions.map(q => q.subject));
    const sortedSubjects = Array.from(subjects).sort();

    res.json({
      success: true,
      data: ['All Subjects', ...sortedSubjects]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subjects'
    });
  }
});

/**
 * Get all questions (with optional subject filter)
 */
router.get('/', (req, res) => {
  try {
    const { subject } = req.query;

    let filteredQuestions = questions;

    if (subject && subject !== 'All Subjects') {
      filteredQuestions = questions.filter(q => q.subject === subject);
    }

    res.json({
      success: true,
      data: filteredQuestions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questions'
    });
  }
});

/**
 * Get a specific question by ID
 */
router.get('/:id', (req, res) => {
  try {
    const questionId = parseInt(req.params.id);
    const question = questions.find(q => q.No === questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch question'
    });
  }
});

/**
 * Add a new question
 */
router.post('/', (req, res) => {
  try {
    const { subject, Question, Answer, Options } = req.body;

    if (!subject || !Question || !Answer) {
      return res.status(400).json({
        success: false,
        error: 'Subject, Question, and Answer are required'
      });
    }

    const maxId = questions.reduce((max, q) => Math.max(q.No, max), 0);
    const newQuestion: Question = {
      No: maxId + 1,
      subject,
      Question,
      Answer,
      Options
    };

    questions.push(newQuestion);

    res.status(201).json({
      success: true,
      data: newQuestion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add question'
    });
  }
});

/**
 * Update an existing question
 */
router.put('/:id', (req, res) => {
  try {
    const questionId = parseInt(req.params.id);
    const questionIndex = questions.findIndex(q => q.No === questionId);

    if (questionIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    const { subject, Question, Answer, Options } = req.body;

    const updatedQuestion: Question = {
      No: questionId,
      subject: subject || questions[questionIndex].subject,
      Question: Question || questions[questionIndex].Question,
      Answer: Answer || questions[questionIndex].Answer,
      Options: Options !== undefined ? Options : questions[questionIndex].Options
    };

    questions[questionIndex] = updatedQuestion;

    res.json({
      success: true,
      data: updatedQuestion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update question'
    });
  }
});

/**
 * Delete a question
 */
router.delete('/:id', (req, res) => {
  try {
    const questionId = parseInt(req.params.id);
    const initialLength = questions.length;

    questions = questions.filter(q => q.No !== questionId);

    if (questions.length === initialLength) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete question'
    });
  }
});

/**
 * Import multiple questions
 */
router.post('/import', (req, res) => {
  try {
    const { questions: newQuestions } = req.body;

    if (!Array.isArray(newQuestions) || newQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid questions array is required'
      });
    }

    let maxId = questions.reduce((max, q) => Math.max(q.No, max), 0);

    const importedQuestions: Question[] = newQuestions.map((qData: Omit<Question, 'No'>) => {
      maxId++;
      return {
        ...qData,
        No: maxId,
      };
    });

    questions.push(...importedQuestions);

    res.status(201).json({
      success: true,
      data: {
        imported: importedQuestions.length,
        total: questions.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to import questions'
    });
  }
});

export default router;
import React, { useState, useEffect, useMemo } from 'react';
import { Question } from '../types';
import { XMarkIcon, PlusCircleIcon, PencilIcon, TrashIcon, ArrowUturnLeftIcon } from './IconComponents';
import Spinner from './Spinner';

interface QuestionBankViewProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  subjects: string[];
  onAdd: (question: Omit<Question, 'No'>) => Promise<void>;
  onUpdate: (question: Question) => Promise<void>;
  onDelete: (questionNo: number) => Promise<void>;
}

const emptyFormData = {
  subject: '',
  Question: '',
  Answer: '',
};

const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  isOpen,
  onClose,
  questions,
  subjects,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState<Omit<Question, 'No'>>(emptyFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All Subjects');

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal is closed
      setIsFormVisible(false);
      setEditingQuestion(null);
      setSearchTerm('');
      setSubjectFilter('All Subjects');
    }
  }, [isOpen]);

  const filteredQuestions = useMemo(() => {
    return questions
      .filter(q => {
        const matchesSubject = subjectFilter === 'All Subjects' || q.subject === subjectFilter;
        const matchesSearch = searchTerm === '' || 
          q.Question.toLowerCase().includes(searchTerm.toLowerCase()) || 
          q.Answer.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSubject && matchesSearch;
      })
      .sort((a, b) => a.subject.localeCompare(b.subject) || a.No - b.No);
  }, [questions, searchTerm, subjectFilter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddNewClick = () => {
    setEditingQuestion(null);
    setFormData({ ...emptyFormData, subject: subjects[0] || '' });
    setIsFormVisible(true);
  };
  
  const handleEditClick = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
        subject: question.subject,
        Question: question.Question,
        Answer: question.Answer
    });
    setIsFormVisible(true);
  };

  const handleDeleteClick = (questionNo: number) => {
    if (window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      onDelete(questionNo);
    }
  }

  const handleCancelForm = () => {
    setIsFormVisible(false);
    setEditingQuestion(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingQuestion) {
        await onUpdate({ ...formData, No: editingQuestion.No });
      } else {
        await onAdd(formData);
      }
      setIsFormVisible(false);
      setEditingQuestion(null);
    } catch (error) {
      console.error("Failed to save question", error);
      // Here you could set an error state to show the user
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" aria-modal="true" role="dialog">
      <div className="glass-panel w-full max-w-4xl h-[90vh] rounded-2xl flex flex-col shadow-2xl shadow-black/40">
        <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-700/80">
          <h2 className="text-2xl font-bold">Question Bank Management</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700/50 transition-colors" aria-label="Close">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-grow p-4 flex flex-col min-h-0">
          {isFormVisible ? (
             <div className="animate-fade-in">
                <h3 className="text-xl font-semibold mb-4 text-brand-primary">{editingQuestion ? 'Edit Question' : 'Add New Question'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-1">Subject</label>
                        <select id="subject" name="subject" value={formData.subject} onChange={handleInputChange} required className="select-embossed w-full p-2 border rounded-md focus:ring-2 focus:ring-brand-primary transition">
                            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="Question" className="block text-sm font-medium text-slate-300 mb-1">Question</label>
                        <textarea id="Question" name="Question" value={formData.Question} onChange={handleInputChange} required rows={3} className="select-embossed w-full p-2 border rounded-md focus:ring-2 focus:ring-brand-primary transition"></textarea>
                    </div>
                    <div>
                        <label htmlFor="Answer" className="block text-sm font-medium text-slate-300 mb-1">Answer</label>
                        <textarea id="Answer" name="Answer" value={formData.Answer} onChange={handleInputChange} required rows={4} className="select-embossed w-full p-2 border rounded-md focus:ring-2 focus:ring-brand-primary transition"></textarea>
                    </div>
                    <div className="flex justify-end items-center gap-4 pt-2">
                        <button type="button" onClick={handleCancelForm} className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 border border-slate-600 hover:bg-slate-700 font-semibold rounded-lg transition text-slate-300 disabled:opacity-50">
                            <ArrowUturnLeftIcon className="w-5 h-5" />
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-brand-primary hover:opacity-80 text-white font-bold rounded-lg transition shadow-glow-primary disabled:opacity-50 disabled:cursor-wait">
                            {isSubmitting ? <Spinner size="sm" /> : (editingQuestion ? 'Save Changes' : 'Add Question')}
                        </button>
                    </div>
                </form>
             </div>
          ) : (
            <>
                <div className="flex-shrink-0 flex flex-col sm:flex-row gap-4 mb-4">
                    <button onClick={handleAddNewClick} className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-primary/20 text-brand-primary border border-brand-primary/50 hover:bg-brand-primary/30 font-semibold rounded-lg transition">
                        <PlusCircleIcon className="w-5 h-5" /> Add New Question
                    </button>
                    <div className="flex-grow flex flex-col sm:flex-row gap-4">
                       <input type="text" placeholder="Search questions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="select-embossed flex-grow p-2 border rounded-md focus:ring-2 focus:ring-brand-primary transition" />
                        <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="select-embossed sm:w-52 p-2 border rounded-md focus:ring-2 focus:ring-brand-primary transition appearance-none">
                            <option value="All Subjects">All Subjects</option>
                            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
    
                <div className="flex-grow overflow-y-auto space-y-3 pr-2 -mr-2">
                    {filteredQuestions.length > 0 ? filteredQuestions.map(q => (
                        <div key={q.No} className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/80">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <p className="font-semibold text-slate-200">{q.Question}</p>
                                    <p className="text-sm text-brand-primary/80 font-medium mt-1">{q.subject}</p>
                                </div>
                                <div className="flex-shrink-0 flex items-center gap-2">
                                    <button onClick={() => handleEditClick(q)} className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition" aria-label="Edit question">
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDeleteClick(q.No)} className="p-2 rounded-full text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition" aria-label="Delete question">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-10 text-slate-500">
                            <p>No questions found.</p>
                        </div>
                    )}
                </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionBankView;

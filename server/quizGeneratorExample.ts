import { generateQuizWithRetry } from './quizGenerator';

// Example usage:
async function exampleUsage() {
  try {
    // Generate a quiz on a specific topic
    const quiz = await generateQuizWithRetry('World War 2');

    console.log(`Quiz on: ${quiz.topic}`);
    console.log(`Total questions: ${quiz.questions.length}`);

    // Print questions by difficulty
    const lowQuestions = quiz.questions.filter(q => q.difficulty === 'Low');
    const mediumQuestions = quiz.questions.filter(q => q.difficulty === 'Medium');
    const highQuestions = quiz.questions.filter(q => q.difficulty === 'High');

    console.log(`\nLow difficulty: ${lowQuestions.length} questions`);
    console.log(`Medium difficulty: ${mediumQuestions.length} questions`);
    console.log(`High difficulty: ${highQuestions.length} questions`);

    // Print first question of each difficulty
    console.log('\nExample questions:');
    console.log(`Low: ${lowQuestions[0]?.question_text}`);
    console.log(`Medium: ${mediumQuestions[0]?.question_text}`);
    console.log(`High: ${highQuestions[0]?.question_text}`);

    return quiz;
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw error;
  }
}

// Run the example
exampleUsage();

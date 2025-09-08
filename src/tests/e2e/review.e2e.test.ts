import { test, expect } from './fixtures';
import { ReviewPage } from './pages/review';

test.describe('Review activity', () => {
  let reviewPage: ReviewPage;

  test.beforeEach(async ({ page }) => {
    reviewPage = new ReviewPage(page);
    await reviewPage.createNewReview();
  });

  test('Send a user message and receive response', async () => {
    // await reviewPage.sendUserMessage('Why is grass green?');
    await reviewPage.sendUserMessage('function hello() {\n  return "world";\n}');
    await reviewPage.isGenerationComplete();

    const assistantMessage = await reviewPage.getRecentAssistantMessage();
    // expect(assistantMessage.content).toContain("It's just green duh!");
    expect(assistantMessage.content).toBeTruthy();
  });

  test('Redirect to /review/:id after submitting message', async () => {
    // await reviewPage.sendUserMessage('Why is grass green?');
    await reviewPage.sendUserMessage('function hello() {\n  return "world";\n}');
    await reviewPage.isGenerationComplete();

    const assistantMessage = await reviewPage.getRecentAssistantMessage();
    // expect(assistantMessage.content).toContain("It's just green duh!");
    expect(assistantMessage.content).toBeTruthy();
    await reviewPage.hasReviewIdInUrl();
  });
});

import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('renders "Go to this link to join this chat" link', () => {
  const { getByText } = render(<App />);
  const linkElement = getByText(/Go to this link to join this chat/i);
  expect(linkElement).toBeInTheDocument();
});

import { render, screen } from '@testing-library/react'
import Button from '@/components/ui/Button'

describe('Button component', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })
})


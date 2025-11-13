import { HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';

interface FAQ {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQ[];
}

export function FAQSection({ faqs }: FAQSectionProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-neutral-200">
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle className="text-teal-600" size={24} />
        <h3>Frequently Asked Questions</h3>
      </div>
      
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left hover:text-teal-600">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-neutral-600">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

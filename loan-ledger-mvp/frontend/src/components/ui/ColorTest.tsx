import React from 'react';
import { Button } from './Button';

export const ColorTest: React.FC = () => {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold text-primary-600">
        Brand Color Test
      </h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Button Variants:</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="accent">Accent Button</Button>
          <Button variant="success">Success Button</Button>
          <Button variant="warning">Warning Button</Button>
          <Button variant="error">Error Button</Button>
          <Button variant="outline">Outline Button</Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Color Swatches:</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-primary-600 text-white p-4 rounded-lg text-center">
            Primary<br/>#214F96
          </div>
          <div className="bg-secondary-500 text-white p-4 rounded-lg text-center">
            Secondary<br/>#FE9F14
          </div>
          <div className="bg-accent-500 text-white p-4 rounded-lg text-center">
            Accent<br/>#F59E0B
          </div>
          <div className="bg-success-500 text-white p-4 rounded-lg text-center">
            Success<br/>#10B981
          </div>
          <div className="bg-warning-500 text-white p-4 rounded-lg text-center">
            Warning<br/>#F59E0B
          </div>
          <div className="bg-error-500 text-white p-4 rounded-lg text-center">
            Error<br/>#EF4444
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Status Colors:</h2>
        <div className="space-y-2">
          <div className="flex items-center space-x-4">
            <span className="text-warning-600 bg-warning-50 border border-warning-200 px-3 py-1 rounded-full text-sm">
              Pending
            </span>
            <span className="text-primary-600 bg-primary-50 border border-primary-200 px-3 py-1 rounded-full text-sm">
              Active
            </span>
            <span className="text-error-600 bg-error-50 border border-error-200 px-3 py-1 rounded-full text-sm">
              Defaulted
            </span>
            <span className="text-success-600 bg-success-50 border border-success-200 px-3 py-1 rounded-full text-sm">
              Completed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
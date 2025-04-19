import React, { useState, useEffect } from 'react';
import testBackendConnection from '../util/testConnection';
import { Container, Button, Card, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';

const DiagnosticPage = () => {
  const [localStatus, setLocalStatus] = useState({ testing: false, result: null });
  const [vercelStatus, setVercelStatus] = useState({ testing: false, result: null });
  const [environment, setEnvironment] = useState({
    mode: import.meta.env.DEV ? 'Development' : 'Production',
    baseURL: axios.defaults.baseURL,
    withCredentials: axios.defaults.withCredentials
  });

  const testLocalBackend = async () => {
    setLocalStatus({ testing: true, result: null });
    const result = await testBackendConnection('http://localhost:8000');
    setLocalStatus({ testing: false, result });
  };

  const testVercelBackend = async () => {
    setVercelStatus({ testing: true, result: null });
    const result = await testBackendConnection('https://backend-5l3616x2m-snehas-projects-3f585613.vercel.app');
    setVercelStatus({ testing: false, result });
  };

  return (
    <Container className="mt-5">
      <h1 className="mb-4">API Connection Diagnostics</h1>
      
      <Card className="mb-4">
        <Card.Header>Environment Information</Card.Header>
        <Card.Body>
          <p><strong>Mode:</strong> {environment.mode}</p>
          <p><strong>Base URL:</strong> {environment.baseURL}</p>
          <p><strong>withCredentials:</strong> {environment.withCredentials.toString()}</p>
        </Card.Body>
      </Card>
      
      <div className="d-flex gap-4 mb-5">
        <Card style={{ width: '50%' }}>
          <Card.Header>Local Backend</Card.Header>
          <Card.Body>
            <Button 
              onClick={testLocalBackend} 
              disabled={localStatus.testing}
              className="mb-3"
            >
              {localStatus.testing ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Testing...
                </>
              ) : 'Test Local Backend'}
            </Button>
            
            {localStatus.result && (
              <Alert variant={localStatus.result.success ? 'success' : 'danger'}>
                {localStatus.result.success 
                  ? `Success (${localStatus.result.status})` 
                  : `Error: ${localStatus.result.error}`}
              </Alert>
            )}
          </Card.Body>
        </Card>
        
        <Card style={{ width: '50%' }}>
          <Card.Header>Vercel Backend</Card.Header>
          <Card.Body>
            <Button 
              onClick={testVercelBackend} 
              disabled={vercelStatus.testing}
              className="mb-3"
            >
              {vercelStatus.testing ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Testing...
                </>
              ) : 'Test Vercel Backend'}
            </Button>
            
            {vercelStatus.result && (
              <Alert variant={vercelStatus.result.success ? 'success' : 'danger'}>
                {vercelStatus.result.success 
                  ? `Success (${vercelStatus.result.status})` 
                  : `Error: ${vercelStatus.result.error}`}
              </Alert>
            )}
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default DiagnosticPage; 
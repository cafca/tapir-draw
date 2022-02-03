import { createKeyPair, recoverKeyPair, Session } from 'p2panda-js';
import { useEffect, useState } from 'react';

// const NODE_URL = 'http://95.217.162.98:2020';
const NODE_URL = 'http://localhost:2020';

export const usePeerToPanda = (): Session => {
  const [keyPair, setKeyPair] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Generate or load key pair on initial page load
    const asyncEffect = async () => {
      let privateKey = window.localStorage.getItem('privateKey');
      if (!privateKey) {
        let keyPair;
        try {
          keyPair = await createKeyPair();
        } catch (err) {
          console.error(err);
        }
        privateKey = keyPair.privateKey();
        if (privateKey) {
          window.localStorage.setItem('privateKey', privateKey);
        }
      }
      const keyPair = await recoverKeyPair(privateKey);
      setKeyPair(keyPair);
    };
    asyncEffect();
  }, []);

  useEffect(() => {
    if (!keyPair) return;
    const session = new Session(NODE_URL);
    session.setKeyPair(keyPair);
    setSession(session);
  }, [keyPair]);

  return session;
};

import './Loading.css';
import { useEffect } from 'react';

export default function Loading() {
    useEffect(()=>{
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    },[]);

    return (
    <div class="page">
        <div class="rotate"></div>
        <div class="loading">Loading...</div>
    </div>
    );
}
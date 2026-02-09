import './Loading.css';

export default function Loading() {
    return (
        <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Loading...</p>
        </div>
    );
}
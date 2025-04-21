"use client"

import Image from "next/image";
import logo from "@/public/yikes.png";
import { useState, useRef, useEffect, useCallback } from 'react';

// Debounce function to limit API calls
function debounce(func, wait) {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

const LinkGen = () => {
	const [inputValue, setInputValue] = useState('');
	const [suggestions, setSuggestions] = useState([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [placeId, setPlaceId] = useState('');
	const [reviewLink, setReviewLink] = useState('');
	const reviewLinkInputRef = useRef(null); // Ref for the review link input
	const autocompleteContainerRef = useRef(null); // Ref for suggestion dropdown container

	// Fetch suggestions from our backend API
	const fetchSuggestions = useCallback(async (input) => {
		if (!input || input.trim().length < 3) { // Only search if input is >= 3 chars
			setSuggestions([]);
			setShowSuggestions(false);
			return;
		}
		setIsLoading(true);
		try {
			const response = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(input)}`);
			if (!response.ok) {
				throw new Error('Failed to fetch suggestions');
			}
			const data = await response.json();
			setSuggestions(data);
			setShowSuggestions(data.length > 0);
		} catch (error) {
			console.error("Error fetching suggestions:", error);
			setSuggestions([]);
			setShowSuggestions(false);
			// Optionally: show an error message to the user
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Debounced version of fetchSuggestions
	const debouncedFetchSuggestions = useCallback(debounce(fetchSuggestions, 300), [fetchSuggestions]); // 300ms delay

	useEffect(() => {
		debouncedFetchSuggestions(inputValue);
	}, [inputValue, debouncedFetchSuggestions]);

	// Handle clicking outside the suggestions box to close it
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (autocompleteContainerRef.current && !autocompleteContainerRef.current.contains(event.target)) {
				setShowSuggestions(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const handleInputChange = (event) => {
		setInputValue(event.target.value);
	};

	const handleSuggestionClick = (suggestion) => {
		setInputValue(suggestion.description); // Set input to the selected place name
		setPlaceId(suggestion.place_id); // Store the place ID
		setSuggestions([]); // Clear suggestions
		setShowSuggestions(false); // Hide suggestions box
		setReviewLink(''); // Clear the existing link if any
		console.log("Selected Place ID:", suggestion.place_id); // For debugging
	};

	// Generate the review link based on the selected place_id
	const handleGenerateLink = () => {
		console.log("Generating link for Place ID:", placeId); // For debugging
		if (placeId) {
			setReviewLink(
				`https://search.google.com/local/writereview?placeid=${placeId}`
			);
		} else {
			alert("Please select a business from the suggestions first.");
		}
	};

	// Copy the generated link to the clipboard
	const handleCopyLink = () => {
		if (reviewLink && reviewLinkInputRef.current) {
			reviewLinkInputRef.current.select(); // Select the text
			navigator.clipboard.writeText(reviewLink)
				.then(() => {
					alert('Link copied to clipboard!');
				})
				.catch(err => {
					console.error('Failed to copy text: ', err);
					alert('Failed to copy link.');
				});

		} else if (!reviewLink) {
			alert("Generate a link first.");
		}
	};

	return (
		<div className='flex flex-col items-center justify-center min-h-screen bg-gray-100'>
			<div className='max-w-3xl md:w-full py-10 px-24 max-sm:px-10 bg-white border border-gray-300 rounded-lg shadow-md'>
				{/* Logo */}
				<Image src={logo} alt='Google' className='w-auto h-16 mb-6 max-sm:h-12' />

				{/* Autocomplete Input */}
				<div className='mb-4 relative' ref={autocompleteContainerRef}>
					<div className='flex flex-row justify-between gap-2 border-main border-3 pl-5'>
						<input
							type="text"
							value={inputValue}
							onChange={handleInputChange}
							placeholder="Enter business name..."
							className="focus:outline-none flex-4 max-md:flex-3 text-sm max-sm:text-xs"
							onFocus={() => setShowSuggestions(suggestions.length > 0)} // Show suggestions on focus if they exist
						/>
						<button
							onClick={handleGenerateLink}
							className='py-3 bg-main text-white font-semibold text-xl max-md:text-xs flex-1 max-md:flex-2 cursor-pointer'
							disabled={isLoading} // Disable button while loading suggestions
						>
							{isLoading ? '...' : 'Generate'}
						</button>
					</div>
					{/* Suggestions Dropdown */}
					{showSuggestions && (
						<ul className='absolute z-10 w-[calc(100%-10rem)] max-md:w-[calc(100%-6rem)] /* Adjust width calculation based on button size */ bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg'>
							{suggestions.map((suggestion) => (
								<li
									key={suggestion.place_id}
									onClick={() => handleSuggestionClick(suggestion)}
									className='px-4 py-2 text-sm cursor-pointer hover:bg-gray-100'
								>
									{suggestion.description}
								</li>
							))}
						</ul>
					)}
				</div>

				{/* Review Link Display & Copy Button */}
				<div className='mt-4'>
					<label
						htmlFor='reviewLink'
						className='block text-gray-700 font-bold text-2xl my-[28px]'
					>
						Your Google review link is:
					</label>
					<div className='flex flex-row justify-between gap-2 border-main border-3 pl-5'>
						<input
							ref={reviewLinkInputRef} // Add ref
							type='text'
							id='reviewLink'
							value={reviewLink} // Bind value to state
							readOnly
							className='focus:outline-none flex-4 max-md:flex-3 text-sm max-sm:text-xs'
							placeholder="Link will appear here..." // Add placeholder
						/>
						<button
							onClick={handleCopyLink} // Updated handler
							className='py-3 bg-main text-white font-semibold text-xl max-md:text-xs flex-1 max-md:flex-2 cursor-pointer'
						>
							Copy
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LinkGen;
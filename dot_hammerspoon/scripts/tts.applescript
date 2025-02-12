use AppleScript version "2.4" -- Yosemite (10.10) or later
use scripting additions

to guessLanguage for input
	script
		use framework "Foundation"
		property this : a reference to current application
		property NSLTag : a reference to NSLinguisticTagger of this

		to guessLanguage()
			(NSLTag's dominantLanguageForString:input) as text
		end guessLanguage
	end script

	result's guessLanguage()
end guessLanguage

on run argv
	set myText to item 1 of argv
	set langCode to guessLanguage for myText
	set speakingRate to 230 as integer

	if ((langCode as string) is equal to "en") then
		say myText using "Jamie (Premium)" speaking rate speakingRate
	else if langCode is equal to "de" then
		say myText using "Anna (Premium)" speaking rate speakingRate
	end if
end run

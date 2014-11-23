Playlists
=========
Documentation for JSON based playlists, for Moovie.

# Item Attributes
Each item in the playlist may contain any of the following properties.

## Tracks
The "tracks" property will accept an array of 
objects; with each one supporting any of the 
following properties: "src", "kind", "srclang", 
"label" and "default".

**Example:**

```
"tracks": [
    {
        "src": "assets/subtitles/avatar.en.srt",
        "kind": "subtitles",
        "srclang": "en",
        "label": "English for the Hearing Impaired",
        "default": true
    }
]
```

## Source
The "src" property can accept a single string. Used if you
only ever want to provide a single video type.

**Example:**

```
"src": "assets/videos/avatar.mp4"
```

## Sources
The "sources" property can accept an array of 
strings. All sources are checked in the order they
appear in the array.

**Example:**

```
"sources": [
    "assets/videos/avatar.mp4",
    "assets/videos/avatar.ogv",
    "assets/videos/avatar.webm"
]
```

## ID
The "id" property is used to identify a singular 
item in the playlist. The provided ID **must** be
unique.

**Example:**

```
"id": "avatar"
```

## Poster
The "poster" property is used to provide an 
image to the video.

**Example:**

```
"poster": "assets/img/avatar-poster.jpg"
```

## Title
The "title" property is the marketed name of the
video. If no ID is provided, an ID will be created
from the title instead. A video title **should** 
be unique.

**Example:**

```
"title": "Avatar"
```

As a side note, the id that will be created from 
this example is: "avatar".

## Year
Useful if you have two videos of the same name. If 
the year is provided it will be added to the id 
created by the "title" attribute. E.g. "avatar-2009"

**Example:**

```
"year": 2009
```

## Description
A summary or synopsis of the video.

**Example:**

```
"description": "Avatar is about aliens..."
```

# Examples

## Example 1
A playlist for all the Resident Evil trailers.

**example.html**
```
<body>
    <video poster="assets/resident-evil-trailers/re1-poster.jpg">
        <source src="assets/resident-evil-trailers/re1.mp4">
        <source src="assets/resident-evil-trailers/re1.ogv">
    </video>
    
    <script>
        
        var video = {
            // video specific options
            video: $$('video')[0],
            autohideControls: true,
            debug: true,
            
            // playlist options to match <video> tag
            title: "Resident Evil",
            year: 2002,
            
            // external playlist
            playlist: "resident-evil-trailers-playlist.json"
        };
        
        Moovie([video]);
        
    </script>
</body>
```

**resident-evil-trailers-playlist.json**

```
[
    {
        "title": "Resident Evil: Apocalypse",
        "year": 2004,
        "poster": "assets/resident-evil-trailers/re2-poster.jpg",
        "sources": [
            "assets/resident-evil-trailers/re2.mp4",
            "assets/resident-evil-trailers/re2.ogv"
        ]
    },
    {
        "title": "Resident Evil: Extinction",
        "year": 2007,
        "poster": "assets/resident-evil-trailers/re3-poster.jpg",
        "sources": [
            "assets/resident-evil-trailers/re3.mp4",
            "assets/resident-evil-trailers/re3.ogv"
        ]
    },
    {
        "title": "Resident Evil: Afterlife",
        "year": 2010,
        "poster": "assets/resident-evil-trailers/re4-poster.jpg",
        "sources": [
            "assets/resident-evil-trailers/re4.mp4",
            "assets/resident-evil-trailers/re4.ogv"
        ]
    },
    {
        "title": "Resident Evil: Retribution",
        "year": 2012,
        "poster": "assets/resident-evil-trailers/re5-poster.jpg",
        "sources": [
            "assets/resident-evil-trailers/re5.mp4",
            "assets/resident-evil-trailers/re5.ogv"
        ]
    }
]
```

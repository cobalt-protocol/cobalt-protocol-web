import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { mapApiProfileToBuilderProfile, type ApiProfileData } from "./profile-api"
import { emptyProfile } from "@/features/profile/data/profile"

describe("mapApiProfileToBuilderProfile", () => {
  it("should return emptyProfile when apiData is null or undefined", () => {
    assert.deepEqual(mapApiProfileToBuilderProfile(null), emptyProfile)
    assert.deepEqual(mapApiProfileToBuilderProfile(undefined), emptyProfile)
  })

  it("should map null or unpopulated API fields to empty strings", () => {
    const unpopulatedApiUser: ApiProfileData = {
      id: "user-123",
      username: null,
      email: null,
      location: null,
      institution: null,
      pitch: null,
      description: null,
      github_link: null,
      linkedin_link: null,
      skills: [],
    }

    const mapped = mapApiProfileToBuilderProfile(unpopulatedApiUser)

    assert.deepEqual(mapped, {
      username: "",
      email: "",
      location: "",
      institution: "",
      pitch: "",
      github_link: "",
      linkedin_link: "",
      skills: [],
    })
  })

  it("should map partially populated API profile data correctly", () => {
    const partialApiUser: ApiProfileData = {
      id: "user-456",
      username: "newbuilder",
      email: "builder@example.com",
      location: null,
      institution: "Tech University",
      pitch: "Building decentralized protocols",
      skills: [{ name: "Solidity", level: "Advanced" }],
    }

    const mapped = mapApiProfileToBuilderProfile(partialApiUser)

    assert.deepEqual(mapped, {
      username: "newbuilder",
      email: "builder@example.com",
      location: "",
      institution: "Tech University",
      pitch: "Building decentralized protocols",
      github_link: "",
      linkedin_link: "",
      skills: [{ name: "Solidity", level: "Advanced" }],
    })
  })

  it("should preserve updated filled profile details when re-fetched from API", () => {
    const updatedApiUser: ApiProfileData = {
      id: "user-123",
      username: "johndoe",
      email: "john@example.com",
      location: "San Francisco",
      institution: "MIT",
      pitch: "Fullstack developer interested in Web3",
      github_link: "https://github.com/johndoe",
      linkedin_link: "https://linkedin.com/in/johndoe",
      skills: [
        { name: "TypeScript", level: "Expert" },
        { name: "Rust", level: "Intermediate" },
      ],
    }

    const mapped = mapApiProfileToBuilderProfile(updatedApiUser)

    assert.deepEqual(mapped, {
      username: "johndoe",
      email: "john@example.com",
      location: "San Francisco",
      institution: "MIT",
      pitch: "Fullstack developer interested in Web3",
      github_link: "https://github.com/johndoe",
      linkedin_link: "https://linkedin.com/in/johndoe",
      skills: [
        { name: "TypeScript", level: "Expert" },
        { name: "Rust", level: "Intermediate" },
      ],
    })
  })
})

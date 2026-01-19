/**
 * Error handling utilities for API calls
 */
interface ErrorWithResponse {
  response?: {
    data?: { message?: string };
    status?: number;
  };
  message?: string;
}

function isErrorWithResponse(error: unknown): error is ErrorWithResponse {
  return error !== null && typeof error === 'object';
}

export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (isErrorWithResponse(error)) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
  }
  return 'Unknown error';
}

export function extractErrorStatus(error: unknown): string | number {
  if (isErrorWithResponse(error)) {
    if (error.response?.status) {
      return error.response.status;
    }
  }
  return 'N/A';
}

export function extractErrorData(error: unknown): unknown {
  if (isErrorWithResponse(error)) {
    return error.response?.data;
  }
  return null;
}

/**
 * Type guards for DTO types
 */
export function isClubDto(club: unknown): club is import('./tabt-client').ClubDto {
  return (
    typeof club === 'object' &&
    club !== null &&
    'uniqueIndex' in club &&
    'name' in club &&
    'longName' in club
  );
}

export function isTeamMatchesEntryDTO(match: unknown): match is import('./tabt-client').TeamMatchesEntryDTO {
  return (
    typeof match === 'object' &&
    match !== null &&
    'matchId' in match &&
    'weekName' in match &&
    'homeClub' in match &&
    'awayClub' in match
  );
}

export function isDivisionEntryDtoV1(division: unknown): division is import('./tabt-client').DivisionEntryDtoV1 {
  return (
    typeof division === 'object' &&
    division !== null &&
    'DivisionId' in division &&
    'Level' in division
  );
}

